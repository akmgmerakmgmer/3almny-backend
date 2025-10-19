import { AppService } from './app.service';
export declare class AppController {
    private readonly appService;
    constructor(appService: AppService);
    getRoot(): {
        success: boolean;
        data: {
            message: string;
        };
    };
    getHello(): string;
}
