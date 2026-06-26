
function getDynamicQuery(user_type, leader_regd_mobile_no, user_email_id) {
  console.log('getDynamicQuery->User Type received from authenticate:', user_type);

  let query = {};

  if (user_type === 'admin') {
    console.log('getDynamicQuery -> user_type: admin');
    query = { leader_regd_mobile_no };
  } else if (user_type === 'user') {
    console.log('getDynamicQuery -> user_type: user');
    query = { leader_regd_mobile_no, user_email_id };
  } else {
    console.warn('getDynamicQuery -> Unknown user_type:', user_type);
    return null; // Let the calling code handle the error
  }

  console.log('Dynamic Query:', query);
  return query;
}

module.exports = getDynamicQuery;
