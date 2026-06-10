export const routes = {
  pet: {
    collection:   '/pet',
    findByStatus: '/pet/findByStatus',
    findByTags:   '/pet/findByTags',
    byId:         (id: number | string) => `/pet/${id}`,
    uploadImage:  (id: number | string) => `/pet/${id}/uploadImage`,
  },
  store: {
    orders:    '/store/order',
    inventory: '/store/inventory',
    orderById: (id: number | string) => `/store/order/${id}`,
  },
  user: {
    collection:      '/user',
    login:           '/user/login',
    logout:          '/user/logout',
    createWithArray: '/user/createWithArray',
    createWithList:  '/user/createWithList',
    byUsername:      (username: string) => `/user/${username}`,
  },
};
