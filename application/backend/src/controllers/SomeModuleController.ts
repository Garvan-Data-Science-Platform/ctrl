import { add, subtract } from 'SomeModule'
import { Get, Post, Body, Route, Tags, Controller, SuccessResponse, Response } from 'tsoa'

@Route('somemodule')
@Tags('SomeModule')
export class SomeModuleController extends Controller {
  /**
   * Adds two numbers together and returns the result
   *
   * @summary Add two numbers
   */
  @Post('/add')
  @SuccessResponse('200', 'OK')
  @Response('500', 'Internal Server Error')
  public addNumbers(@Body() bodyRequest: { a: number; b: number }) {
    return { result: add(bodyRequest.a, bodyRequest.b) }
  }

  /**
   * Subtracts two numbers and returns the result
   *
   * @summary Subtract two numbers
   */
  @Post('/subtract')
  @SuccessResponse('200', 'OK')
  @Response('500', 'Internal Server Error')
  public subtractNumbers(@Body() bodyRequest: { a: number; b: number }) {
    return { result: subtract(bodyRequest.a, bodyRequest.b) }
  }

  /**
   * Health check to ensure server is up and running
   *
   * @summary Health Check
   */
  @Get('/')
  @SuccessResponse('200', 'OK')
  @Response('500', 'Internal Server Error')
  public HealthCheck() {
    return { message: 'API is healthy' }
  }
}
