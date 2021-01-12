import fs from 'fs';
import path from 'path';
import { MapLike } from 'typescript';
import _, { concat } from 'lodash';
import cheerio from 'cheerio';

import { getExamList, getExamDetail, getExamDetailAndAnswer, postExam } from './util';
async function main() {
  // 存储数据
  let resultData: any = [];
  // 题型定义
  let questionTypeConfig: any = [{
    value: 1,
    label: 'SingleChoice'
  }, {
    value: 2,
    label: 'MultipleChoice'
  }, {
    value: 3,
    label: 'Judgment'
  }]

  // 获取测试examid
  let examListDom = await getExamList();
  const $ = cheerio.load(examListDom.data, {
    decodeEntities: true, // Decode HTML entities
  });
  let examTitleArry: any = [];
  $('.pro-item').toArray().forEach((x: any) => {
    let title: any = $(x).find('a').attr('title');
    let url: any = $(x).find('a').attr('href');
    let id: any = url.substring(14, url.length);
    let examData = {
      title: title,
      id: id
    }
    examTitleArry.push(examData);
  })

  // 获取考卷
  // console.log('测试题库', examTitleArry)
  // console.log('测试套数', examTitleArry.length)
  examTitleArry.map(async (x: any, index: any) => {
    if (index < 150) {
      let examData: any = {};

      // 获取考卷paperid
      let examDetail = await getExamDetail(x.id);
      const $examDetail = cheerio.load(examDetail.data, {
        decodeEntities: true, // Decode HTML entities
      });
      let paperid: any = $examDetail('.play-banner').attr('data-pid');

      examData[`pid`] = paperid;

      examData[`stem`] = 'exam';

      examData[`timer`] = 515;

      examData[`_hash`] = '1Fq44w5F';

      let questionArry: any = $examDetail('.play-item');
      let questionidFirst: any = '';
      questionArry.toArray().forEach((x: any, index: any) => {
        let questionid: any = $examDetail(x).attr('data-qid');
        if (index < 1) {
          questionidFirst = questionid;
        }
        let questiontype: any = $examDetail(x).attr('data-qtype');
        examData[`type[${questionid}]`] = parseInt(questiontype)
      });

      examData[`exam[${questionidFirst}]`] = 0;
      // console.log(examData)

      // 交卷
      await postExam(examData, x.id);

      // 获取测试结果
      let examDetailAndAnswer = await getExamDetailAndAnswer(paperid);
      // console.log("examDetailAndAnswer.data", examDetailAndAnswer.data)

      const $examDetailAndAnswer = cheerio.load(examDetailAndAnswer.data, {
        decodeEntities: true, // Decode HTML entities
      });

      // 获取question title
      // 获取question type
      let itemquestionDom = $examDetailAndAnswer("#exam-area .play-item");

      itemquestionDom.toArray().forEach((questionx: any) => {
        let itemquestionData: any = {
          paperid: paperid,
          examTitle: x.title,
          question: { markdown: '', preview: '' },
          analysis: { markdown: '', preview: '' },
          options: [],
          answers: [],
          type: 'Other',
          difficulty: 30
        };

        // 试题类型
        let examDetailType: any = $examDetailAndAnswer(questionx).attr('data-qtype');
        switch (examDetailType) {
          case '1':
            itemquestionData.type = 'SingleChoice';
            break;
          case '2':
            itemquestionData.type = 'MultipleChoice';
            break;
          case '3':
            itemquestionData.type = 'Judgment';
            break;
          default:
            itemquestionData.type = 'Other'
            break;
        }

        // 试题标题
        let examDetailTitle: any = $examDetailAndAnswer(questionx).find(".exam-title div:last-child").text();
        if (examDetailTitle !== "") {
          itemquestionData.question.markdown = examDetailTitle;
          itemquestionData.question.preview = `<div class='markdown-body'><p class='md-p'>${examDetailTitle}</p></div>`;
        } else {
          let examDetailTitleOther: any = $examDetailAndAnswer(questionx).find(".content-intro div:last-child").text();
          itemquestionData.question.markdown = examDetailTitleOther;
          itemquestionData.question.preview = `<div class='markdown-body'><p class='md-p'>${examDetailTitleOther}</p></div>`;
        }

        // 试题解析
        let examDetailAnalysis: any = $examDetailAndAnswer(questionx).find(".exam-analysis-info").text();
        itemquestionData.analysis.markdown = examDetailAnalysis;
        itemquestionData.analysis.preview = `<div class='markdown-body'><p class='md-p'>${examDetailAnalysis}</p></div>`

        // 试题选项
        let examDetailOptions: any = $examDetailAndAnswer(questionx).find(".exam-option");
        if (itemquestionData.type === 'Judgment') {
          itemquestionData.options.push({
            option: 'true',
            content: {
              markdown: `对`,
              preview: `<div class='markdown-body'><p class='md-p'>对</p></div>`
            }
          }, {
            option: 'false',
            content: {
              markdown: `错`,
              preview: `<div class='markdown-body'><p class='md-p'>错</p></div>`
            }
          })
          examDetailOptions.toArray().forEach((y: any) => {
            let option = $examDetailAndAnswer(y).attr("data-options");
            // 判断题答案
            let examDetailAnswers: any = $examDetailAndAnswer(y).find(".rig").toArray();
            if (examDetailAnswers.length && option === 'A') {
              itemquestionData.answers.push('true');
            }
            if (examDetailAnswers.length && option === 'B') {
              itemquestionData.answers.push('false');
            }
          })
        } else {
          examDetailOptions.toArray().forEach((y: any) => {
            let option = $examDetailAndAnswer(y).attr("data-options");
            let optionContent = $examDetailAndAnswer(y).find('.exam-option-content div:last-child').html();
            itemquestionData.options.push({
              option: option,
              content: {
                markdown: optionContent,
                preview: `<div class='markdown-body'><p class='md-p'>${optionContent}</p></div>`
              }
            })

            // 单选题/多选题答案
            let examDetailAnswers: any = $examDetailAndAnswer(y).find(".rig").toArray();
            if (examDetailAnswers.length) {
              itemquestionData.answers.push(option);
            }
          });
        }

        if (itemquestionData.type !== 'Other') {
          resultData.push(itemquestionData)
        }
      })
      // console.log('所有试题', resultData);
      let allData = {
        resultData: resultData
      }
      fs.writeFile("resultData.json", JSON.stringify(allData), err => {
        if (!err) console.log("success~");
      });
      console.log('总题数：', resultData.length)
    }
  });
};
main();