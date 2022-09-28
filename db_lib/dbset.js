const sql_con = require('./index');

exports.executeQuery = async (queryString, arrVal) => {
    const results = await sql_con.promise().query(queryString, arrVal)
    return results[0]
};