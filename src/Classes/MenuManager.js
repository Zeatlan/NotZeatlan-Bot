import inquirer from 'inquirer'

/** Inquirer menu generator */
export default class MenuManager {
  type = 'list';
  name = '';
  message = '';
  choices = [];
  default = '';

  answer;

  /**
   * 
   * @param {string} type 
   * @param {string} name 
   * @param {string} message 
   * @param {string[]} choices 
   */
  constructor(type, name, message, choices = [], defaultValue = '') {
    this.type = type;
    this.name = name;
    this.message = message;
    this.choices = choices;
    this.default = defaultValue;
    this.answer = null;
  }

  /**
   * Generating menu
   * @returns {string}
   */
  async handleMenu() {
    console.log();
    this.answer = await inquirer.prompt([
      {
        type: this.type,
        name: this.name,
        message: this.message,
        choices: this.choices,
        default: this.default
      }
    ])

    return this.answer[this.name];
  }
}