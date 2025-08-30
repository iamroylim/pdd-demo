/**
 * 工作流引擎 - 基于配置数组自动执行操作
 *
 * 使用示例：
 * const workflow = [
 *   { action: "click", item: ".phone-login" },
 *   { action: "sleep", value: 2000 },
 *   { action: "input", value: "xxx", item: ".internation-code-input" }
 * ];
 * await executeWorkflow(page, workflow);
 */

export interface WorkflowStep {
  action:
    | 'click'
    | 'sleep'
    | 'input'
    | 'wait'
    | 'scroll'
    | 'screenshot'
    | 'evaluate'
    | 'type'
    | 'focus'
    | 'hover'
    | 'select'
    | 'press'
    | 'clear'
    | 'goto'
    | 'reload'
    | 'back'
    | 'forward'
    | 'setViewport'
    | 'waitForNavigation'
    | 'waitForFunction'
    | 'waitForRequest'
    | 'waitForResponse'
    | 'setCookie'
    | 'deleteCookie'
    | 'getCookies'
    | 'addScriptTag'
    | 'addStyleTag'
    | 'setExtraHTTPHeaders'
    | 'setUserAgent'
    | 'setGeolocation'
    | 'emulateMediaType'
    | 'setOfflineMode';
  item?: string; // CSS selector
  value?:
    | string
    | number
    | boolean
    | Record<string, any>
    | ((...args: any[]) => string); // 输入值或等待时间
  timeout?: number; // 超时时间，默认3000ms
  description?: string; // 步骤描述
}

export interface WorkflowContext {
  page: any;
  mobile?: string;
  variables?: Record<string, any>;
}

export interface WorkflowResult {
  success: boolean;
  step: number;
  action: string;
  error?: string;
  duration: number;
}

export class WorkflowEngine {
  private context: WorkflowContext;
  private results: WorkflowResult[] = [];

  constructor(context: WorkflowContext) {
    this.context = context;
  }

  /**
   * 执行完整工作流
   */
  async execute(steps: WorkflowStep[]): Promise<WorkflowResult[]> {
    console.log(
      `[${this.context.mobile || 'workflow'}] 开始执行工作流，共${
        steps.length
      }个步骤`
    );

    this.results = [];

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const startTime = Date.now();

      try {
        console.log(
          `[${this.context.mobile || 'workflow'}] 执行步骤 ${i + 1}/${
            steps.length
          }: ${step.description || step.action}`
        );

        await this.executeStep(step);

        const duration = Date.now() - startTime;
        this.results.push({
          success: true,
          step: i + 1,
          action: step.action,
          duration,
        });

        console.log(
          `[${this.context.mobile || 'workflow'}] 步骤 ${
            i + 1
          } 执行成功 (${duration}ms)`
        );
      } catch (error) {
        const duration = Date.now() - startTime;
        const result: WorkflowResult = {
          success: false,
          step: i + 1,
          action: step.action,
          error: error instanceof Error ? error.message : String(error),
          duration,
        };

        this.results.push(result);
        console.error(
          `[${this.context.mobile || 'workflow'}] 步骤 ${i + 1} 执行失败:`,
          error
        );

        // 继续执行后续步骤，不中断工作流
        console.log(
          `[${this.context.mobile || 'workflow'}] 跳过步骤 ${
            i + 1
          }，继续执行后续步骤`
        );
      }
    }

    console.log(`[${this.context.mobile || 'workflow'}] 工作流执行完成`);
    return this.results;
  }

  /**
   * 执行单个步骤
   */
  private async executeStep(step: WorkflowStep): Promise<void> {
    const { page } = this.context;
    const timeout = step.timeout || 3000;

    try {
      switch (step.action) {
        case 'goto':
          if (typeof step.value !== 'string')
            throw new Error('goto操作需要指定value为URL字符串');
          await page.goto(step.value, { waitUntil: 'networkidle2' });
          break;

        case 'click':
          if (!step.item) throw new Error('click操作需要指定item选择器');
          try {
            // 等待元素可见且可点击
            await page.waitForSelector(step.item, {
              timeout,
              state: 'visible',
            });
            //
            // 点击元素
            await page.click(step.item);
          } catch (error) {
            // 如果常规点击失败，尝试使用 JavaScript 点击
            try {
              await page.evaluate((selector) => {
                const element = document.querySelector(selector);
                if (element) {
                  element.click();
                }
              }, step.item);
            } catch (jsError) {
              throw new Error(
                `点击元素失败: ${step.item} - ${error} - JS点击尝试: ${jsError}`
              );
            }
          }
          break;

        case 'sleep':
          const sleepTime = typeof step.value === 'number' ? step.value : 1000;
          await new Promise((resolve) => setTimeout(resolve, sleepTime));
          break;

        case 'input':
          if (!step.item) throw new Error('input操作需要指定item选择器');
          if (step.value === undefined)
            throw new Error('input操作需要指定value值');

          try {
            await page.waitForSelector(step.item, { timeout });
            await page.focus(step.item);

            // 清空现有内容
            await page.evaluate((selector: string) => {
              const element = document.querySelector(
                selector
              ) as HTMLInputElement;
              if (element) {
                element.select();
              }
            }, step.item);

            await page.keyboard.press('Backspace');
            await page.type(step.item, String(step.value));
          } catch (error) {
            throw new Error(`输入内容失败: ${step.item} - ${error}`);
          }
          break;

        case 'wait':
          if (!step.item) throw new Error('wait操作需要指定item选择器');
          try {
            await page.waitForSelector(step.item, { timeout });
          } catch (error) {
            throw new Error(`等待元素失败: ${step.item} - ${error}`);
          }
          break;

        case 'scroll':
          const scrollValue = step.value || 0;
          try {
            await page.evaluate((scrollY: number) => {
              window.scrollTo(0, scrollY);
            }, scrollValue);
          } catch (error) {
            throw new Error(`滚动页面失败 - ${error}`);
          }
          break;

        case 'screenshot':
          const screenshotPath = step.value || `screenshot_${Date.now()}.png`;
          try {
            await page.screenshot({
              path: String(screenshotPath),
              fullPage: true,
            });
          } catch (error) {
            throw new Error(`截图失败 - ${error}`);
          }
          break;

        case 'evaluate':
          if (typeof step.value !== 'string')
            throw new Error('evaluate操作需要指定value为JavaScript代码');
          try {
            await page.evaluate((js: string) => {
              eval(js);
            }, step.value);
          } catch (error) {
            throw new Error(`执行JavaScript失败 - ${error}`);
          }
          break;

        case 'type':
          if (step.value === undefined)
            throw new Error('type操作需要指定value值');
          try {
            await page.keyboard.type(String(step.value));
          } catch (error) {
            throw new Error(`键盘输入失败 - ${error}`);
          }
          break;

        case 'focus':
          if (!step.item) throw new Error('focus操作需要指定item选择器');
          try {
            await page.waitForSelector(step.item, { timeout });
            await page.focus(step.item);
          } catch (error) {
            throw new Error(`聚焦元素失败: ${step.item} - ${error}`);
          }
          break;

        case 'hover':
          if (!step.item) throw new Error('hover操作需要指定item选择器');
          try {
            await page.waitForSelector(step.item, { timeout });
            await page.hover(step.item);
          } catch (error) {
            throw new Error(`悬停元素失败: ${step.item} - ${error}`);
          }
          break;

        case 'select':
          if (!step.item) throw new Error('select操作需要指定item选择器');
          if (step.value === undefined)
            throw new Error('select操作需要指定value值');
          try {
            await page.waitForSelector(step.item, { timeout });
            await page.select(step.item, String(step.value));
          } catch (error) {
            throw new Error(`选择下拉框失败: ${step.item} - ${error}`);
          }
          break;

        case 'press':
          if (step.value === undefined)
            throw new Error('press操作需要指定value值');
          try {
            await page.keyboard.press(String(step.value));
          } catch (error) {
            throw new Error(`按键失败 - ${error}`);
          }
          break;

        case 'clear':
          if (!step.item) throw new Error('clear操作需要指定item选择器');
          try {
            await page.waitForSelector(step.item, { timeout });
            await page.evaluate((selector: string) => {
              const element = document.querySelector(
                selector
              ) as HTMLInputElement;
              if (element) {
                element.value = '';
                element.dispatchEvent(new Event('input', { bubbles: true }));
              }
            }, step.item);
          } catch (error) {
            throw new Error(`清空输入框失败: ${step.item} - ${error}`);
          }
          break;

        default:
          throw new Error(`不支持的操作类型: ${step.action}`);
      }
    } catch (error) {
      // 将错误信息包装后抛出，包含步骤详情
      throw new Error(`${step.description || step.action} - ${error}`);
    }
  }

  /**
   * 获取执行结果
   */
  getResults(): WorkflowResult[] {
    return [...this.results];
  }

  /**
   * 获取成功执行的步骤数
   */
  getSuccessCount(): number {
    return this.results.filter((r) => r.success).length;
  }

  /**
   * 获取总执行时间
   */
  getTotalDuration(): number {
    return this.results.reduce((sum, r) => sum + r.duration, 0);
  }
}

/**
 * 便捷函数：直接执行工作流
 */
export async function executeWorkflow(
  page: any,
  steps: WorkflowStep[],
  mobile?: string
): Promise<WorkflowResult[]> {
  const engine = new WorkflowEngine({ page, mobile });
  return await engine.execute(steps);
}

/**
 * 工作流验证器
 */
export class WorkflowValidator {
  static validate(steps: WorkflowStep[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    steps.forEach((step, index) => {
      switch (step.action) {
        case 'click':
        case 'input':
        case 'wait':
        case 'focus':
          if (!step.item) {
            errors.push(
              `步骤 ${index + 1}: ${step.action}操作需要指定item选择器`
            );
          }
          break;
        case 'input':
          if (step.value === undefined) {
            errors.push(`步骤 ${index + 1}: input操作需要指定value值`);
          }
          break;
        case 'evaluate':
          if (typeof step.value !== 'string') {
            errors.push(
              `步骤 ${
                index + 1
              }: evaluate操作需要指定value为JavaScript代码字符串`
            );
          }
          break;
      }
    });

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
