const request = require('request');
const expect = require('chai').expect;

describe('get home', () => {
    it('should return 200 Ok', (done) => {
        request.get('http://localhost:8080/', (err, res) => {
            expect(res.statusCode).equals(200);
            done();
        });
    });
    it('should return undefined', (done) => {
        request.get('https://localhost:8080/', (err, res) => {
            expect(res).equals(undefined);
            done();
        });
    });
    it('should return home html', (done) => {
        request.get('http://localhost:8080/', (err, res) => {
            expect('Content-Type', /html/);
            done();
        });
    });
});

describe('get login', () => {
    it('should return 200 Ok', (done) => {
        request.get('http://localhost:8080/login', (err, res) => {
            expect(res.statusCode).equals(200);
            done();
        });
    });
    it('should return undefined', (done) => {
        request.get('https://localhost:8080/login', (err, res) => {
            expect(res).equals(undefined);
            done();
        });
    });
    it('should return login html', (done) => {
        request.get('http://localhost:8080/login', (err, res) => {
            expect('Content-Type', /html/);
            done();
        });
    });
});

describe('get registration', () => {
    it('should return 200 Ok', (done) => {
        request.get('http://localhost:8080/registration', (err, res) => {
            expect(res.statusCode).equals(200)
            done();
        });
    });
    it('should return undefined', (done) => {
        request.get('https://localhost:8080/registration', (err, res) => {
            expect(res).equals(undefined);
            done();
        });
    });
    it('should return registration html', (done) => {
        request.get('http://localhost:8080/registration', (err, res) => {
            expect('Content-Type', /html/);
            done();
        });
    });
});

describe('get search of test', () => {
    it('should return 200 Ok', function() {
        request.get('http://localhost:8080/search?keyword=test'), (err, res) => {
            Response.statusCode.should.equal(304);
            done();
        };
    });
    it('should return undefined', (done) => {
        request.get('https://localhost:8080/search?keyword=test', (err, res) => {
            expect(res).equals(undefined);
            done();
        });
    });
    it('should return list that is not empty', function() {
        request.get('http://localhost:8080/search?keyword=test'), (err, res) => {
            expect(JSON.parse(res.body).length).greaterThan(0);
            done();
        };
    });
    it('should return search html', (done) => {
        request.get('http://localhost:8080/search?keyword=test', (err, res) => {
            expect('Content-Type', /html/);
            done();
        });
    });
});

describe('get thread posting', () => {
    it('should return 200 Ok', function() {
        request.get('http://localhost:8080/thread/5cdb4c979a6d5a00177b9ea9'), (err, res) => {
            expect(res.statusCode).equals(200);
            done();
        };
    });
    it('should return undefined', (done) => {
        request.get('https://localhost:8080/thread/5cdb4c979a6d5a00177b9ea9', (err, res) => {
            expect(res).equals(undefined);
            done();
        });
    });
    it('should return thread html', (done) => {
        request.get('http://localhost:8080/thread/5cdb4c979a6d5a00177b9ea9', (err, res) => {
            expect('Content-Type', /html/);
            done();
        });
    });
});

describe('get test user profile', () => {
    it('should return 200 Ok', function() {
        request.get('http://localhost:8080/user/5cd5f6f65d97905d40aac5d0'), (err, res) => {
            expect(res.statusCode).equals(200);
            done();
        };
    });
    it('should return undefined', (done) => {
        request.get('https://localhost:8080/user/5cd5f6f65d97905d40aac5d0', (err, res) => {
            expect(res).equals(undefined);
            done();
        });
    });
    it('should return user profile html', (done) => {
        request.get('http://localhost:8080/user/5cd5f6f65d97905d40aac5d0', (err, res) => {
            expect('Content-Type', /html/);
            done();
        });
    });
});
