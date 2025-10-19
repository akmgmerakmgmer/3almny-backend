"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const common_1 = require("@nestjs/common");
const http_exception_filter_1 = require("./common/filters/http-exception.filter");
const cookie_parser_1 = require("cookie-parser");
const platform_express_1 = require("@nestjs/platform-express");
const express_1 = require("express");
const expressApp = (0, express_1.default)();
let cachedApp = null;
async function createApp() {
    if (cachedApp) {
        return cachedApp;
    }
    const adapter = new platform_express_1.ExpressAdapter(expressApp);
    const app = await core_1.NestFactory.create(app_module_1.AppModule, adapter, {
        cors: {
            origin: process.env.FRONTEND_ORIGIN || true,
            credentials: true,
        },
    });
    app.use((0, cookie_parser_1.default)());
    app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    app.useGlobalFilters(new http_exception_filter_1.GlobalHttpExceptionFilter());
    await app.init();
    cachedApp = app;
    return app;
}
async function bootstrap() {
    const app = await createApp();
    await app.listen(process.env.PORT || 4000);
    console.log(`Application is running on: ${await app.getUrl()}`);
}
if (process.env.NODE_ENV !== 'production') {
    bootstrap();
}
exports.default = async (req, res) => {
    await createApp();
    return expressApp(req, res);
};
//# sourceMappingURL=main.js.map