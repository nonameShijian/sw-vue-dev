import { createRouter, createWebHashHistory } from 'vue-router';

const router = createRouter({
	history: createWebHashHistory("/"),
	routes: [
		{
			path: '/',
			name: '',
			component: () => import('../views/IndexPage.vue'),
		},
		{
			path: '/login',
			name: 'login',
			component: () => import('../views/LoginPage.vue'),
		},
		{
			path: '/register',
			name: 'register',
			component: () => import('../views/RegisterPage.vue'),
		},
		{
			path: '/:pathMatch(.*)*',
			name: 'notFound',
			component: () => import('../views/NotFoundPage.vue'),
		},
	],
});

export default router;