import fs from 'node:fs/promises'
import path from 'node:path'
import type { Workspace } from './workspace.types'

export async function writeNestBackend(target: string, project: Workspace) {
  const backend = path.join(target, 'backend')
  const healthModuleImport = './modules/health/health.module'
  const files: Record<string, string> = {
    'package.json': `${JSON.stringify({
      name: `${project.slug}-backend`, private: true, version: '0.0.0',
      scripts: { dev: 'nest start --watch', build: 'nest build', start: 'node dist/main.js', 'start:prod': 'node dist/main.js', 'type-check': 'tsc --noEmit', lint: 'eslint .' },
      dependencies: { '@nestjs/common': '^11.0.0', '@nestjs/core': '^11.0.0', '@nestjs/platform-express': '^11.0.0', 'better-sqlite3': '^11.5.0', pg: '^8.13.1', 'reflect-metadata': '^0.2.2', rxjs: '^7.8.1', zod: '^3.23.8' },
      devDependencies: { '@nestjs/cli': '^11.0.0', '@types/better-sqlite3': '^7.6.12', '@types/node': '^22.10.0', '@types/pg': '^8.11.10', eslint: '^9.16.0', 'typescript-eslint': '^8.18.0', typescript: '~5.7.0' },
    }, null, 2)}\n`,
    'nest-cli.json': `${JSON.stringify({ collection: '@nestjs/schematics', sourceRoot: 'src' }, null, 2)}\n`,
    'tsconfig.json': `${JSON.stringify({ compilerOptions: { module: 'commonjs', declaration: true, removeComments: true, emitDecoratorMetadata: true, experimentalDecorators: true, allowSyntheticDefaultImports: true, target: 'ES2022', sourceMap: true, outDir: './dist', baseUrl: './', incremental: true, strict: true, skipLibCheck: true }, include: ['src/**/*.ts'] }, null, 2)}\n`,
    'eslint.config.mjs': `import eslint from '@eslint/js'\nimport tseslint from 'typescript-eslint'\nexport default tseslint.config(eslint.configs.recommended, ...tseslint.configs.recommended, { ignores: ['dist/**'], rules: { '@typescript-eslint/no-explicit-any': 'off' } })\n`,
    '.env.example': 'PORT=3000\nHOST=127.0.0.1\nDB_DIALECT=sqlite\nDATABASE_URL=\n',
    'src/main.ts': mainSource,
    'src/app.module.ts': `import { Module } from '@nestjs/common'\nimport { HealthModule } from '${healthModuleImport}'\n\n@Module({ imports: [HealthModule] })\nexport class AppModule {}\n`,
    'src/modules/health/health.module.ts': `import { Module } from '@nestjs/common'\nimport { HealthController } from './health.controller'\n\n@Module({ controllers: [HealthController] })\nexport class HealthModule {}\n`,
    'src/modules/health/health.controller.ts': `import { Controller, Get } from '@nestjs/common'\n\n@Controller('health')\nexport class HealthController {\n  @Get()\n  check() { return { status: 'ok' } }\n}\n`,
    'src/common/interceptors/response.interceptor.ts': responseInterceptorSource,
    'src/common/filters/global-exception.filter.ts': exceptionFilterSource,
    'src/common/pipes/zod-validation.pipe.ts': zodPipeSource,
    'src/database/database.types.ts': `export type DatabaseDialect = 'sqlite' | 'postgres'\nexport interface Database { query<T>(sql: string, params?: unknown[]): Promise<T[]>; execute(sql: string, params?: unknown[]): Promise<void> }\n`,
    'src/database/README.md': '# Database\n\n本地使用 SQLite，生产使用 PostgreSQL。业务 Repository 只能依赖 `Database` 接口，迁移文件必须在 `migrations/sqlite` 和 `migrations/postgres` 成对维护。\n',
    'migrations/sqlite/.gitkeep': '', 'migrations/postgres/.gitkeep': '',
  }
  for (const [relative, content] of Object.entries(files)) {
    const destination = path.join(backend, relative)
    await fs.mkdir(path.dirname(destination), { recursive: true })
    await fs.writeFile(destination, content)
  }
}

const mainSource = `import 'reflect-metadata'\nimport { NestFactory } from '@nestjs/core'\nimport { AppModule } from './app.module'\nimport { GlobalExceptionFilter } from './common/filters/global-exception.filter'\nimport { ResponseInterceptor } from './common/interceptors/response.interceptor'\n\nasync function bootstrap() {\n  const app = await NestFactory.create(AppModule)\n  app.setGlobalPrefix('api')\n  app.enableCors()\n  app.useGlobalFilters(new GlobalExceptionFilter())\n  app.useGlobalInterceptors(new ResponseInterceptor())\n  await app.listen(Number(process.env.PORT ?? 3000), process.env.HOST ?? '127.0.0.1')\n}\nvoid bootstrap()\n`
const responseInterceptorSource = `import type { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common'\nimport { Injectable } from '@nestjs/common'\nimport type { Observable } from 'rxjs'\nimport { map } from 'rxjs/operators'\n\n@Injectable()\nexport class ResponseInterceptor<T> implements NestInterceptor<T, { code: number; data: T; message: string }> {\n  intercept(_context: ExecutionContext, next: CallHandler<T>): Observable<{ code: number; data: T; message: string }> {\n    return next.handle().pipe(map((data) => ({ code: 0, data, message: 'ok' })))\n  }\n}\n`
const exceptionFilterSource = `import type { ArgumentsHost, ExceptionFilter } from '@nestjs/common'\nimport { Catch, HttpException, HttpStatus } from '@nestjs/common'\n\ntype HttpResponse = { status(code: number): HttpResponse; json(body: unknown): void }\n\n@Catch()\nexport class GlobalExceptionFilter implements ExceptionFilter {\n  catch(error: unknown, host: ArgumentsHost) {\n    const response = host.switchToHttp().getResponse<HttpResponse>()\n    const status = error instanceof HttpException ? error.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR\n    const message = error instanceof Error ? error.message : 'Internal server error'\n    response.status(status).json({ code: status, data: null, message })\n  }\n}\n`
const zodPipeSource = `import { BadRequestException, Injectable } from '@nestjs/common'\nimport type { PipeTransform } from '@nestjs/common'\nimport type { ZodType } from 'zod'\n\n@Injectable()\nexport class ZodValidationPipe implements PipeTransform {\n  constructor(private readonly schema: ZodType) {}\n  transform(value: unknown) {\n    const result = this.schema.safeParse(value)\n    if (!result.success) throw new BadRequestException(result.error.flatten())\n    return result.data\n  }\n}\n`
