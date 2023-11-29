const { memberBusiness } = require(process.cwd() + '/member/memberbusiness');
const { authenticationBusiness } = require(process.cwd() +
    '/utility/userauthentication');

let memberRoutes = [
    {
        type: 'get',
        path: '/y/:shortroute?',
        controller: memberBusiness.redirectToYogaClass,
    },
    {
        type: 'get',
        path: '/test',
        controller: memberBusiness.redirectToTest,
    },
    {
        type: 'get',
        path: '/resetrediskey/:key?',
        controller: memberBusiness.resetRedisKey,
    },
    {
        type: 'post',
        path: '/redisdeletebulk',
        controller: memberBusiness.deleteMultipleKeys,
    },
    {
        type: 'get',
        path: '/d/:shortroute?',
        controller: memberBusiness.redirectToDanceStretchClass,
    },
    {
        type: 'get',
        path: '/calculatedevice',
        controller: memberBusiness.calculateDevice,
    },
];

module.exports = {
    memberRoutes,
};
