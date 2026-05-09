export const LOCAL_USERS = [
  {
    username: 'amr',
    password: '100200300',
    uid: 'local-amr',
    email: 'amr@alshouk.com',
    displayName: 'عمرو',
    role: 'مدير',
  },
  {
    username: 'ahmed',
    password: '100200300',
    uid: 'local-ahmed',
    email: 'ahmed@alshouk.com',
    displayName: 'أحمد',
    role: 'كاشير',
  },
  {
    username: 'ewis',
    password: '100200300',
    uid: 'local-ewis',
    email: 'ewis@alshouk.com',
    displayName: 'إيوس',
    role: 'مندوب',
  },
];

export function findLocalUser(username, password) {
  const user = LOCAL_USERS.find(
    (u) => u.username === username.toLowerCase().trim()
  );
  if (!user) return null;
  if (user.password !== password) return null;
  return user;
}
