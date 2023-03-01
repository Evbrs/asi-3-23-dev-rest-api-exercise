export class AppError extends Error {
  #errMessages = null
  #httpCode = null
  #errCode = "error.app"

  constructor(
    errMessages = ["Uh, Houston, we've had a problem"],
    httpCode = 500,
    errCode
  ) {
    super(errMessages.join(" | "))

    this.#errMessages = errMessages
    this.#httpCode = httpCode
    this.#errCode = errCode
  }

  get errMessages() {
    return this.#errMessages
  }

  get httpCode() {
    return this.#httpCode
  }

  get errCode() {
    return this.#errCode
  }
}

export class NotFoundError extends AppError {
  constructor(errMessages = ["Not found"]) {
    super(errMessages, 404, "error.app.notFound")
  }
}

export class InvalidArgumentError extends AppError {
  constructor(errMessages = ["Invalid arguments"]) {
    super(errMessages, 422, "error.app.InvalidArgumentError")
  }
}

export class InvalidCredentialsError extends AppError {
  constructor(errMessages = ["Invalid credentials"]) {
    super(errMessages, 401, "error.app.InvalidCredentialsError")
  }
}

export class InvalidSessionError extends AppError {
  constructor(errMessages = ["Invalid session"]) {
    super(errMessages, 403, "error.app.InvalidSessionError")
  }
}

export class InvalidAccessError extends AppError {
  constructor(errMessages = ["Not enough permission."]) {
    super(errMessages, 403, "error.app.InvalidAccessError")
  }
}
