/**
 * User
 *
 * @module      :: Model
 * @description :: A short summary of how this model works and what it represents.
 * @docs		:: http://sailsjs.org/#!documentation/models
 */

module.exports = {

  attributes: {
  	
  	username: {
        type: 'email',
        required: true
    },
    password: 'string',
    access: {
      collection: 'org',
      via: 'users'
    }
    
  }

};
