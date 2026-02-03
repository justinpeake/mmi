import { Injectable } from '@nestjs/common';

@Injectable()
export class ExampleService {
  getExample() {
    return {
      message: 'Example feature module - replace or extend for your MMI flows',
      design: 'https://www.figma.com/make/3lxU3TJjw61ENJyjDuKL1k/MMI',
    };
  }
}
