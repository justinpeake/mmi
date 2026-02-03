import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getInfo() {
    return {
      name: 'MMI',
      version: process.env.npm_package_version ?? '0.1.0',
      api: 'api',
      docs: 'Design: https://www.figma.com/make/3lxU3TJjw61ENJyjDuKL1k/MMI',
    };
  }
}
