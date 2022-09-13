import inquirer from 'inquirer'

export default class MenuManager {
  type = 'list';
  name = '';
  message = '';
  choices = [];

  answer;

  constructor(type, name, message, choices) {
    this.type = type;
    this.name = name;
    this.message = message;
    this.choices = choices;
    this.answer = null;
  }

  async handleMenu() {
    console.log();
    this.answer = await inquirer.prompt([
      {
        type: this.type,
        name: this.name,
        message: this.message,
        choices: this.choices
      }
    ])

    return this.answer[this.name];
  }
}