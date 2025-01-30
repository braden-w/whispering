import { userConfiguredServices } from '$lib/services';
import type { WhisperingErrProperties } from '@repo/shared';
import { createQuery } from '@tanstack/svelte-query';

export function useGetMediaDevices() {
	return {
		getMediaDevicesQuery: createQuery<
			Pick<MediaDeviceInfo, 'label' | 'deviceId'>[],
			WhisperingErrProperties
		>(() => ({
			queryKey: ['mediaDevices'],
			queryFn: async () => {
				const enumerateRecordingDevicesResult =
					await userConfiguredServices.recorder.enumerateRecordingDevices();
				if (!enumerateRecordingDevicesResult.ok) {
					throw enumerateRecordingDevicesResult.error;
				}
				return enumerateRecordingDevicesResult.data;
			},
		})),
	};
}
