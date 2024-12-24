import { Ok, Err, type Result, tryAsync, trySync } from '@epicenterhq/result';
export type { Result };
export { Ok, Err, tryAsync, trySync } from '@epicenterhq/result';

export type ServiceFn<I, O, ServiceErrorProperties extends { _tag: string }> = (
	input: I,
) =>
	| Promise<Result<O, ServiceErrorProperties>>
	| Result<O, ServiceErrorProperties>;

type ServiceErrorFns<ServiceErrorProperties extends { _tag: string }> = {
	Err: (props: ServiceErrorProperties) => Err<ServiceErrorProperties>;
	trySync: <T>(opts: {
		try: () => T extends Promise<unknown> ? never : T;
		mapErr: (error: unknown) => ServiceErrorProperties;
	}) => Result<T, ServiceErrorProperties>;
	tryAsync: <T>(opts: {
		try: () => Promise<T>;
		mapErr: (error: unknown) => ServiceErrorProperties;
	}) => Promise<Result<T, ServiceErrorProperties>>;
};

export const createServiceErrorFns = <
	ServiceErrorProperties extends { _tag: string },
>(): ServiceErrorFns<ServiceErrorProperties> => ({
	Err: Err,
	trySync: trySync,
	tryAsync: tryAsync,
});

export function createMutation<I, O, ServiceError, TContext = undefined>({
	mutationFn,
	onMutate = () => Ok(undefined as TContext),
	onSuccess = () => undefined,
	onError = () => undefined,
	onSettled = () => undefined,
}: {
	mutationFn: (
		input: I,
		args: { context: TContext },
	) => Promise<Result<O, ServiceError>> | Result<O, ServiceError>;
	onMutate?: (
		input: I,
	) => Promise<Result<TContext, ServiceError>> | Result<TContext, ServiceError>;
	onSuccess?: (output: O, args: { input: I; context: TContext }) => void;
	onError?: (
		error: ServiceError,
		args: { input: I; contextResult: Result<TContext, ServiceError> },
	) => void;
	onSettled?: (
		result: Result<O, ServiceError>,
		args: { input: I; contextResult: Result<TContext, ServiceError> },
	) => void;
}) {
	const mutate = async (input: I): Promise<void> => {
		const contextResult = await onMutate(input);
		if (!contextResult.ok) {
			const error = contextResult.error;
			onError(error, { input, contextResult });
			onSettled(contextResult, { input, contextResult });
			return;
		}
		const context = contextResult.data;
		const result = await mutationFn(input, { context });
		if (!result.ok) {
			const error = result.error;
			onError(error, { input, contextResult });
			onSettled(result, { input, contextResult });
			return;
		}
		const output = result.data;
		onSuccess(output, { input, context });
		onSettled(result, { input, contextResult });
	};
	return mutate;
}
