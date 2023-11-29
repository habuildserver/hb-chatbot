const GET_SHORT_LINK_DETAILS_ROUTE_BY_ROUTE = `select hs.id as shortlinkid, hs.base_url,hs.memberid as id,hs.long_url,hs."type",hs.last_redirected_at,hs.programid,hmsd.status as memberstatus,
case when hmsd.current_channel is null then 'CUSTOMMEETTYPE' else hmsd.current_channel end as current_channel,(select sd.value from habuild_static_data sd where sd.key='YT_LINK' limit 1) as ytlink, hmsd.isytapp,
(select sd.value from habuild_static_data sd where sd.key='DS_YT_LINK' limit 1) as dsytlink 
from habuild_shortlinks hs 
left join habuild_member_subscription_details hmsd ON hs.memberid=hmsd.memberid and hs.programid=hmsd.programid 
where lower(hs.short_route) =($1) and hs.programid= ($2)`;

const GET_YT_LINK = `select sd.value as ytlink from habuild_static_data sd where sd.key='YT_LINK' limit 1`;

const GET_DS_YT_LINK = `select sd.value as dsytlink from habuild_static_data sd where sd.key='DS_YT_LINK' limit 1`;

const ADD_REDIRECTION_SHORTLINK_LOGS =
    'SELECT * from public.addredirectionshortlinklog($1);';

const GET_WEEK_REDIRECT_LOGS = `select id,member_id,created_at,useragent from habuild_redirect_shortlinks_logs_week23oct hrsl where device is null and  useragent is not null order by created_at;`;
 

const UPDATE_DEVICE_IN_REDIRECT_LOGS = `select * from updateMemberDeviceDetails($1)`;


module.exports = {
    GET_SHORT_LINK_DETAILS_ROUTE_BY_ROUTE,
    GET_YT_LINK,
    ADD_REDIRECTION_SHORTLINK_LOGS,
    GET_DS_YT_LINK,
    GET_WEEK_REDIRECT_LOGS,
    UPDATE_DEVICE_IN_REDIRECT_LOGS
}
