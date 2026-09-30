import { supabase } from './supabase';

export {
  fetchStudioProfileFromDb,
  upsertStudioProfileInDb,
} from './studio';

export {
  fetchServicesFromDb,
  upsertServiceInDb,
  deleteServiceFromDb,
} from './services';

export {
  fetchPortfolioProjectsFromDb,
  upsertPortfolioProjectInDb,
  deletePortfolioProjectFromDb,
  uploadPortfolioMedia,
} from './portfolio';

/**
 * Subscribes to realtime changes for the Phase 5D public content tables.
 * AppContext refetches the affected collection when a database change occurs.
 */
export function subscribeToPublicContentChanges(options: {
  onProfileChanged?: () => void;
  onServicesChanged?: () => void;
  onPortfolioChanged?: () => void;
}): () => void {
  const channel = supabase
    .channel(`public-content-${Date.now()}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'studio_profile',
      },
      () => {
        options.onProfileChanged?.();
      }
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'services',
      },
      () => {
        options.onServicesChanged?.();
      }
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'portfolio_projects',
      },
      () => {
        options.onPortfolioChanged?.();
      }
    );

  channel.subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}
