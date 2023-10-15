"use strict";

module.exports = {
  isOwner: function (request, response) {
    if (request.session.is_logined) {
      // console.log(request.session.is_logined);
      return true;
    } else {
      return false;
    }
  },
};
