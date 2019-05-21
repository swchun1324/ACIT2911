const chai = require('chai');
const server = require('../server');
const chaiHttp = require('chai-http');
const assert = require("chai").assert;
var should = chai.should();
const messages = require('../messaging');

chai.use(chaiHttp);

process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

describe('get_date', function() {
    it("should get the date");
});

describe("add_dm", function() {
    it("should add a direct message to database", (done) => {
        chai.request
            .agent('https://localhost:8080/')
            .post('/login')
            .type('form')
            .send({
                username: 'test_account',
                password: 'test_password'
            })
            .then((res) => {
                return chai.request.agent('https://localhost:8080/')
                    .post('/add_dm')
                    .type('form')
                    .send({
                        message_body: 'test dm'
                    })
                    .then((res) => {
                        // console.log(res);
                        var str = res.text;
                        var dm_text = /test dm/i;
                        var result = dm_text.test(str);
                        assert.equal(result, true);
                        done();
                    })
                    .catch(err => {
                        throw err;
                    });
            })
            .catch(err => {
                throw err;
            });
        agent.close();
    });
});
