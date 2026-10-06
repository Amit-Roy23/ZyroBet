import { useQuery } from '@tanstack/react-query';
import { gameKeys } from '../keys';
import { fetchGamesCatalog } from '../api';
import { GameItem } from '../types';

export function useGames() {
  return useQuery<GameItem[]>({
    queryKey: gameKeys.catalog(),
    queryFn: fetchGamesCatalog,
    staleTime: 5 * 60 * 1000,
  });
}
