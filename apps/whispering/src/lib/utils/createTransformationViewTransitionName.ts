export function createTransformationViewTransitionName({
	transformationId,
}: {
	transformationId: string | null;
}): string {
	return `transformation-${transformationId ?? 'none'}`;
}
