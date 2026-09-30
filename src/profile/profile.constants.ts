// Natural key of the card owner's profile: the seed recreates it, the API reads it.
export const MAIN_PROFILE_SLUG = 'me';

// Page sizes of the profile list. The maximum bounds the work of one request:
// every relation is loaded for the whole page at once.
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 50;
