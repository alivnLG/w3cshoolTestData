import axios, { AxiosRequestConfig } from 'axios';
import cheerio from 'cheerio';

import qs from 'qs';

import FormData from 'form-data';

import { cookie } from '../config';

// 获取所有测试列表
export async function getExamList() {
  let axiosConfig: AxiosRequestConfig = {
    url: `https://www.w3cschool.cn/exam`,
    method: 'GET',
    headers: {
      accept: `*/*`,
      'accept-encoding': `gzip, deflate, br`,
      'accept-language': `zh-CN,zh;q=0.9,en;q=0.8`,
      cookie: cookie,
      referer: `https://www.w3cschool.cn/`,
      'sec-fetch-mode': `navigate`,
      'sec-fetch-site': `same-origin`,
      'user-agent': `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36`
    }
  };
  let rst = await axios.request(axiosConfig);
  return rst;
}

// 获取某个id的测试内容，主要是获取测试试卷的id，用于下一步获取正确答案
export async function getExamDetail(id: string) {
  let axiosConfig: AxiosRequestConfig = {
    url: `https://www.w3cschool.cn/exam/test`,
    method: 'GET',
    headers: {
      accept: `*/*`,
      'accept-encoding': `gzip, deflate, br`,
      'accept-language': `zh-CN,zh;q=0.9,en;q=0.8`,
      cookie: cookie,
      referer: `https://www.w3cschool.cn/`,
      'sec-fetch-mode': `navigate`,
      'sec-fetch-site': `same-origin`,
      'user-agent': `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36`
    },
    params: {
      id: id
    }
  };

  let rst = await axios.request(axiosConfig);
  return rst;
}

//交卷
export async function postExam(examData: any, testid: any) {
  let axiosConfig: AxiosRequestConfig = {
    url: `https://www.w3cschool.cn/exam/checkExam`,
    method: 'POST',
    headers: {
      accept: `*/*`,
      'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'accept-encoding': `gzip, deflate, br`,
      'accept-language': `zh-CN,zh;q=0.9,en;q=0.8`,
      cookie: cookie,
      referer: `https://www.w3cschool.cn/exam/test?id=${testid}`,
      'sec-fetch-mode': `cors`,
      'sec-fetch-dest': 'empty',
      'sec-fetch-site': `same-origin`,
      'user-agent': `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36`
    },
    data: qs.stringify(examData)
  };

  let rst = await axios.request(axiosConfig);
  return rst;
}

// 获取某个id测试的正确答案及测试内容
export async function getExamDetailAndAnswer(paperid: string) {
  let axiosConfig: AxiosRequestConfig = {
    url: `https://www.w3cschool.cn/exam/score`,
    method: 'GET',
    headers: {
      accept: `*/*`,
      'accept-encoding': `gzip, deflate, br`,
      'accept-language': `zh-CN,zh;q=0.9,en;q=0.8`,
      cookie: cookie,
      referer: `https://www.w3cschool.cn/`,
      'sec-fetch-mode': `navigate`,
      'sec-fetch-site': `same-origin`,
      'user-agent': `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36`
    },
    params: {
      paperid: paperid,
      stem: 'exam'
    }
  };

  let rst = await axios.request(axiosConfig);
  return rst;
}
