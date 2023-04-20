/**
 * Created Date: Tuesday, October 31st 2017, 3:01:08 pm
 * Author: yugasun
 * Email: yuga.sun.bj@gmail.com
 * -----
 * Last Modified:
 * Modified By:
 * -----
 * Copyright (c) 2017 yugasun
 */

async function Sleep (time) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(time)
    }, time * 1000)
  })
}

function getComment(code) {
  if (!code) return "";
  const start = code.search("<!--");
  const end = code.search("-->");
  const comment = code.substring(start, end + 3);
  return comment;
}

function getKV(comment, k) {
  console.log("comment", comment)
  if (comment === "") return "";
  // var reg = new RegExp("@" + k + ":\s(.*)");
  const index = comment.search("@" + k);
  var result = comment.match(reg);
  return result;
}

module.exports = {
  Sleep: Sleep,
  getComment,
  getKV
}
