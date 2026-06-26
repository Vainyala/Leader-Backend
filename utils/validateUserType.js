
function validateUserType(user_type, res) {
  console.log('validateUserType:  User Type received: ', user_type);

  if (user_type === 'user') {
    console.log('validateUserType -> user_type: user: Action forbidden.');
    return res.status(403).json('Alert! Action forbidden');      
  } else {
    console.log('validateUserType -> user_type: admin: Add / Update / Delete action allowed.');
  }

  return;
}

module.exports = validateUserType;