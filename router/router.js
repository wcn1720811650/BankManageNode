const express = require("express")
const router = express.Router();
const db = require('../db/index')
const multer = require('multer');
const upload = multer({dest: 'uploads/'});
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser")


router.use(bodyParser.urlencoded({extended: false}))
router.use(bodyParser.json())

router.all("*", function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*")
    res.header("Access-Control-Allow-Headers", "Content-Type")
    res.header("Access-Control-Allow-Methods", "*")
    res.header("Content-Type", "application/json;charset=utf-8")
    next()
})

//获取普通用户信息
router.get('/userList', function (req, res) {
    const checkSqlStr = 'select * from user where position = 2'
    db.query(checkSqlStr, (err, result) => {
        if (err) return err
        res.send({"code": 200, "dataList": result})
    });
})

//获取teller信息
router.get('/tellerList', function (req, res) {
    const checkSqlStr = 'select * from user where position = 1'
    db.query(checkSqlStr, (err, result) => {
        if (err) return err
        res.send({"code": 200, "dataList": result})
    });
})



//获取存款
router.post('/getBalance', (req, res) => {
    const userName = req.body.userName;
    const getBalanceSql = 'SELECT balance FROM user WHERE userName = ?'
    db.query(getBalanceSql, [userName], (err, res) => {
        if (err) throw err;
        res.send({code: 1, data: res})
    })
})

router.post('/addAdminList', upload.single('file'), function (req, res) {
    res.setHeader('Content-Type', 'multipart/form-data')
    console.log(req);
    res.send({"code": 200, "data": 'ok'});
})

//出纳员注销账户
router.post('/delete', (req, res) => {
    const userName = req.body.username;
    if (!userName) {
        res.send({
            code: 0,
            msg: "请输入用户名！！！",
        })
    }

    if (userName) {
        const result = `SELECT * FROM user WHERE userName = '${userName}'`
        db.query(result, [userName], (err, results) => {
            if (err) throw err;
            if (results.length < 1) {
                res.send({code: 0, msg: "用户名不存在，请重试"})
            } else {
                const sql = `DELETE FROM user WHERE userName = ? `;
                db.query(sql, [userName], (err, result) => {
                    if (err) throw err;
                    if (result.affectedRows !== 1) {
                        res.send({code: 0, msg: "修改数据失败"})
                    } else {
                        res.send({code: 1, msg: '修改数据成功'})
                    }
                })
            }
        })
    }
})

//出纳员冻结账户
router.post('/freeze', (req, res) => {
    const userName = req.body.username;
    const status = req.body.status;
    if (!userName) {
        res.send({
            code: 0,
            msg: "用户不存在！！！",
        })
    }
    if (userName && status) {
        const result = `SELECT * FROM user WHERE userName = '${userName}'`
        db.query(result, [userName], (err, results) => {
            if (err) throw err;
            if (results.length < 1) {
                res.send({code: 0, msg: "用户不存在，请重试"})
            } else {
                const sql = `UPDATE user SET status ='${status}' WHERE userName=?`;
                db.query(sql, [userName, status], (err, result) => {
                    if (err) throw err;
                    if (result.affectedRows === 1) {
                        res.send({code: 1, msg: "修改成功"})
                    } else {
                        res.send({code: 0, msg: "修改失败"})
                    }
                })
            }
        })
    }
})

//修改密码
router.post('/changePassword', (req, res) => {
    const userName = req.body.username;
    const passWord = req.body.newPassword;
    if (!userName) {
        res.send({
            code: 0,
            msg: "请输入用户名！",
        })
    }
    if (userName && passWord) {
        const result = `SELECT * FROM user WHERE userName = '${userName}'`
        db.query(result, [userName], (err, results) => {
            if (err) throw err;
            if (results.length < 1) {
                res.send({code: 0, msg: "用户不存在，请重试"})
            } else {
                const sql = `UPDATE user SET passWord ='${passWord}' WHERE userName=?`;
                db.query(sql, [userName, passWord], (err, result) => {
                    if (err) throw err;
                    if (result.affectedRows === 1) {
                        res.send({code: 1, msg: "修改成功"})
                    } else {
                        res.send({code: 0, msg: "修改失败"})
                    }
                })
            }
        })
    }
})

//存钱
router.post('/makeDeposits', (req, res) => {
    const userName = req.body.username;
    const deposit = req.body.deposit;
    if (!userName) {
        res.send({
            code: 0,
            msg: "请输入用户名！！！",
        })
    }
    if (deposit <= 0) {
        res.send({code: 0, msg: "请输入有效存钱数！！！"})
    }
    if (userName && deposit) {
        const checkBalanceSql = "SELECT balance FROM user WHERE userName = ?"
        db.query(checkBalanceSql, [userName], (err, results) => {
            if (err) throw err;
            const updateAccountSql = "UPDATE user SET balance = balance + ? WHERE userName = ?"
            db.query(updateAccountSql, [deposit, userName], (err, result) => {
                if (err) throw err;
                if (result.affectedRows === 1) {
                    res.send({code: 1, msg: "存款成功"})
                } else {
                    res.send({code: 0, msg: "存款失败"})
                }
            })
        })
    }
})

//取钱
router.post('/withdrawal', (req, res) => {
    const userName = req.body.username;
    const withdraw = req.body.withdraw;
    if (!userName) {
        res.send({
            code: 0,
            msg: "请输入用户名！",
        })
    }
    if (withdraw <= 0) {
        res.send({code: 0, msg: "请输入正确取钱数"})
    }
    if (userName && withdraw) {
        const checkBalanceSql = "SELECT balance FROM user WHERE userName = ?"
        db.query(checkBalanceSql, [userName], (err, results) => {
            if (err) throw err;
            const currentBalance = results[0].balance;
            if (currentBalance < withdraw) {
                res.send({code: 0, msg: "余额不足，无法完成取钱"})
            } else {
                const updateAccountSql = "UPDATE user SET balance = balance - ? WHERE userName = ?"
                db.query(updateAccountSql, [withdraw, userName], (err, result) => {
                    if (err) throw err;
                    if (result.affectedRows === 1) {
                        res.send({code: 1, msg: "取款成功"})
                    } else {
                        res.send({code: 0, msg: "取款失败"})
                    }
                })
            }
        })
    }
})

//修改密码
router.post("/checkPassword", (req, res) => {
    const userName = req.body.username;
    const passWord = req.body.password;
    if (!userName || !passWord) {
        res.send({
            code: 0,
            msg: "请输入用户名密码",
        })
        return
    }
    const sqlStr = "select * from user WHERE userName=? AND passWord=?"

    db.query(sqlStr, [userName, passWord], (err, result) => {
        if (err) throw err
        if (result.length > 0) {
            res.send({code: 1, msg: "账号密码正确！！！"})
        } else {
            res.send({code: 0, msg: "账号密码有误！！！"})
        }
    })
})

//转账
router.post("/transferFunds", (req, res) => {
    const fromAccount = req.body.fromAccount;
    const toAccount = req.body.toAccount;
    const amount = req.body.amount;

    if (!fromAccount || !toAccount || !amount || amount <= 0) {
        res.send({
            code: 0,
            msg: "请输入有效的转账信息",
        });
        return;
    }

    const checkBalanceSql = "SELECT balance FROM user WHERE userName = ?";
    db.query(checkBalanceSql, [fromAccount], (balanceErr, balanceResult) => {
        if (balanceErr) throw balanceErr;

        const currentBalance = balanceResult[0].balance;

        if (currentBalance < amount) {
            res.send({
                code: 0,
                msg: "余额不足，无法完成转账",
            });
        } else {
            const updateFromAccountSql = "UPDATE user SET balance = balance - ? WHERE userName = ?";
            const updateToAccountSql = "UPDATE user SET balance = balance + ? WHERE userName = ?";
            db.query(updateFromAccountSql, [amount, fromAccount], (err, result) => {
                if (err) throw err
                db.query(updateToAccountSql, [amount, toAccount], (err, result) => {
                    if (err) throw err
                    res.send({
                        code: 1,
                        msg: "转账成功",
                    })
                })
            })
        }
    })
})

//token登录
router.post("/login", (req, res) => {
    const userName = req.body.username;
    const passWord = req.body.password;
    if (!userName || !passWord) {
        res.send({
            code: 0,
            msg: "请输入用户名密码",
        })
        return
    }
    const sqlStr = "select * from user WHERE userName=? AND passWord=?"

    db.query(sqlStr, [userName, passWord], (err, result) => {
        if (err) throw err
        if (result.length > 0) {
            // 生成token
            let token = jwt.sign(
                {
                    identity: result[0].identity,
                    userName: result[0].userName,
                },
                "secret",
                {expiresIn: "1h"},
            )
            const checkPositionSql = "SELECT position FROM user WHERE userName = ?";
            db.query(checkPositionSql,[userName],(err,positionResult)=>{
                const currentPosition = positionResult[0].position;
                console.log(token)
                if (currentPosition === 0) {
                    res.send({code: 1, msg: "管理员登陆成功", token: token, path: "/manage"})
                } else if (currentPosition === 1) {
                    res.send({code: 2, msg: "出纳员登录成功", token: token, path: "/teller"})
                } else {
                    res.send({code: 3, msg: "登陆成功", userName: userName, token: token, path: "/depositors"})
                }
            })
        } else {
            // 判断token
            if (req.headers.authorization === undefined || req.headers.authorization == null) {
                if (req.headers.authorization) {
                    const token = req.headers.authorization.split(" ")[1] // 获取token
                }
                jwt.verify(token, "secret", (err, decode) => {
                    if (err) {
                        res.send({code: 0, msg: "账号或密码错误"})
                    }
                })
            }
        }
    })
})

//注册
router.post("/register", (req, res) => {
    const userName = req.body.username;
    const passWord = req.body.password;
    const position = req.body.position;
    const nickName = req.body.nickname;
    if (!userName || !passWord) {
        res.send({
            code: 0,
            msg: "请输入用户名密码",
        })
        return
    }
    if (userName && passWord) {
        const result = `SELECT * FROM user WHERE userName = '${userName}'`
        db.query(result, [userName], (err, results) => {
            if (err) throw err
            if (results.length >= 1) {
                //2、如果有相同用户名，则注册失败，用户名重复
                res.send({code: 0, msg: "注册失败，用户名重复"})
            } else {
                const sqlStr = "insert into user(userName,passWord,position,nickName) values(?,?,?,?)"
                db.query(sqlStr, [userName, passWord, position, nickName], (err, results) => {
                    if (err) throw err
                    if (results.affectedRows === 1) {
                        res.send({code: 1, msg: "注册成功"})
                    } else {
                        res.send({code: 0, msg: "注册失败"})
                    }
                })
            }
        })
    }
})


module.exports = router;