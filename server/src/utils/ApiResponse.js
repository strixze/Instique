class ApiResponse {
  constructor(statusCode, data, message = 'Success', meta = null) {
    this.statusCode = statusCode;
    this.success = true;
    this.data = data;
    this.message = message;
    if (meta) this.meta = meta;
  }
}

export default ApiResponse;
