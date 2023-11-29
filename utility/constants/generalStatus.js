exports.MemberStatus = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  PAUSED: "PAUSED",
  LEAD: "LEAD",
  PAUSE_DAYS: 100,
  PAUSE: 0,
  NA: "NA",
  MEMBER: "MEMBER",
};

exports.LeadStatus = {
  ONLY_MOBILE: "ONLY_MOBILE",
  OLNT_EMAIL: "OLNT_EMAIL",
  COMPLETED: "COMPLETED",
  REGISTERED: "REGISTERED",
  CONVERTED: "CONVERTED",
  COLD: "COLD",
};

exports.PaymentStatus = {
  SUCCESS: "SUCCESS",
  PENDING: "PENDING",
  FAILED: "FAILED",
  PG: "PG",
  RAZORPAY: "RAZORPAY",
  INIT: "INIT",
  REFUNDED: "REFUNDED"
};

exports.PaymentSource = {
  OFFLINE: "UPI_OFFLINE",
  LINK: "https://linktr.ee/habuild.yoga"
};

exports.WA_COMMUNICATION_STATUS = {
  ACTIVE: "ACTIVE",
  PAUSED: "PAUSED",
  INACTIVE: "INACTIVE",
};

exports.NotificationStatus = {
  SUCCESS: "SUCCESS",
  PENDING: "PENDING",
  FAILED: "FAILED",
};

exports.QuoteType = {
  MEMBER: "MEMBER",
  LEAD: "LEAD",
};

exports.RazorPayStatus = {
  AUTHORIZED: "AUTHORIZED",
  CAPTURED: "CAPTURED",
  CREATED: "CREATED",
  REFUNDED: "REFUNDED",
  FAILED: "FAILED"
}

exports.ZoomLogIdentifier = {
  MEMBER: "MEMBER",
  LEAD: "LEAD",
};

exports.MemberBatchStatus = {
  ACTIVE: "ACTIVE",
  INIT: "INIT",
  PENDING: "PENDING",
  COMPLETED: "COMPLETED"
}

exports.ApiResponse = {
  SUCCESS: "SUCCESS",
  FAILED: "FAILED",
}

exports.ShortlinkStatus = {
  PROVIDER: "HABUILD"
}

exports.WatiTemplateStatus = {
  LEAD: 'LEAD',
  MEMBER: 'MEMBER'
}

exports.ShortlinksTypes = {
  CUSTOM: 'CUSTOM',
  MEET: 'MEET',
}

exports.COOKIES = {
  SHORTROUTE: "shortRoute",
}

exports.OrderStatus = {
  DESC:'desc',
  ASC: 'asc'
}

exports.LeadRegistrationChannel = {
  ZOOM:'ZOOM',
  YOUTUBE: 'YOUTUBE'
}