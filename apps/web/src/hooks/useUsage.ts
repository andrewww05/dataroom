import { useQuery } from '@tanstack/react-query';
import { fetchClient } from '@/api/client';
import type { RoomUsage } from '@dataroom/shared';

export function useUsage(dataRoomId?: string) {
  return useQuery({
    queryKey: ['usage', dataRoomId],
    queryFn: () => fetchClient<RoomUsage>(`/data-rooms/${dataRoomId}/usage`),
    enabled: !!dataRoomId,
  });
}
