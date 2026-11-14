// Coach avatar images, keyed by coach id (see src/data/coaches.ts).
// Metro needs static require() paths, so each image is listed explicitly.
// Remove a line to fall back to that coach's emoji icon.
export const AVATAR_IMAGES: Record<string, number | undefined> = {
  lebron: require('@/assets/images/coaches/lebron_james.png'),
  ronnie: require('@/assets/images/coaches/ronnie_coleman.png'),
  bolt: require('@/assets/images/coaches/usain_bolt.png'),
  ronaldo: require('@/assets/images/coaches/cristiano_ronaldo.png'),
  serena: require('@/assets/images/coaches/serena_williams.png'),
  callina: require('@/assets/images/coaches/callina_liang.png'),
  patty: require('@/assets/images/coaches/lean_beef_patty.png'),
};