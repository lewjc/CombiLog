export default class EnvironmentError extends Error {
	public static MISSING_ENVIRONMENT_VARIABLE = (variableName: string): string =>
		`Missing expected environment variable: ${variableName}`;

	constructor(public message: string) {
		super(message);
		this.name = EnvironmentError.name;
	}
}
