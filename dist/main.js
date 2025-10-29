"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const common_1 = require("@nestjs/common");
const http_exception_filter_1 = require("./common/filters/http-exception.filter");
const platform_express_1 = require("@nestjs/platform-express");
const express = require('express');
const expressApp = express();
let cachedApp = null;
async function createApp() {
    if (cachedApp) {
        return cachedApp;
    }
    const adapter = new platform_express_1.ExpressAdapter(expressApp);
    const allowedOrigins = process.env.FRONTEND_ORIGIN
        ? process.env.FRONTEND_ORIGIN.split(',').map(o => o.trim())
        : ['http://localhost:3000', 'http://localhost:3001'];
    expressApp.set('trust proxy', 1);
    const app = await core_1.NestFactory.create(app_module_1.AppModule, adapter, {
        cors: {
            origin: (origin, callback) => {
                if (!origin) {
                    return callback(null, true);
                }
                if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
                    callback(null, true);
                }
                else {
                    console.warn(`CORS: Origin ${origin} not allowed. Allowed origins: ${JSON.stringify(allowedOrigins)}`);
                    if (process.env.NODE_ENV === 'production') {
                        callback(new Error('Not allowed by CORS'));
                    }
                    else {
                        callback(null, true);
                    }
                }
            },
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization'],
            exposedHeaders: ['Content-Type', 'Authorization'],
            maxAge: 86400,
        },
    });
    app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    app.useGlobalFilters(new http_exception_filter_1.GlobalHttpExceptionFilter());
    await app.init();
    cachedApp = app;
    return app;
}
async function bootstrap() {
    const app = await createApp();
    const port = process.env.PORT || 4000;
    await app.listen(port, '0.0.0.0');
    console.log(`Application is running on: http://localhost:${port}`);
}
if (process.env.NODE_ENV !== 'production') {
    bootstrap();
}
exports.default = async (req, res) => {
    try {
        const app = await createApp();
        const expressApp = app.getHttpAdapter().getInstance();
        return expressApp(req, res);
    }
    catch (error) {
        console.error('Vercel handler error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
//# sourceMappingURL=main.js.map