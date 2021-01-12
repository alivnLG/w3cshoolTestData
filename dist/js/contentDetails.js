let urlPath = window.location.pathname;

let urlPathArry = urlPath ? urlPath.split('/') : [];

let language = (navigator.language || navigator.browserLanguage).toLowerCase();

let apiAxios = axios.create({
  baseURL: baseURL
});
let userData = JSON.parse(localStorage.getItem('userData'));

// 添加请求拦截器
apiAxios.interceptors.request.use(
  function(config) {
    config.headers['x-usage'] = 'api';
    let sid = localStorage.getItem('sid') || '';
    if (sid) {
      config.headers['x-sid'] = sid;
    }
    return config;
  },
  function(error) {
    return Promise.reject(error);
  }
);

// 添加响应拦截器
apiAxios.interceptors.response.use(
  function(response) {
    return response;
  },
  function(error) {
    if (error.response.status === 401) {
      window.location.href = `/login?redirect=${urlPath}`;
    }
    return Promise.reject(error);
  }
);

let commentTitle = ''; // 选中的文本
let createCommentBoxStyle = {};

let app = new Vue({
  el: '#app',
  components: {
    commentCard
  },
  created() {
    let self = this;
    self.emptyPage = true;
    let urlObj = {
      experiments: /^\/projects\/[0-9a-fA-F]{24}\/experiments\/[0-9a-fA-F]{24}$/,
      ideas: /^\/projects\/[0-9a-fA-F]{24}\/ideas\/[0-9a-fA-F]{24}$/,
      shares: /^\/shares\/[0-9a-fA-F]{24}$/
    };
    _(urlObj).forEach(function(value, key) {
      let result = value.test(urlPath);
      if (result) {
        switch (key) {
          case 'experiments':
            let payload = {
              type: 'Experiment',
              code: 'experiments',
              project: urlPathArry[2],
              id: urlPathArry[4]
            };
            self.expermentOrIdeas(payload);
            break;
          case 'ideas':
            let payloadData = {
              type: 'Idea',
              code: 'ideas',
              project: urlPathArry[2],
              id: urlPathArry[4]
            };
            self.expermentOrIdeas(payloadData);
            break;
          case 'shares':
            let shareId = {
              shareId: urlPathArry[2]
            };
            apiAxios
              .get(`/shares/${shareId.shareId}`)
              .then(response => {
                self.type = 'share';
                let result = response.data;
                self.contentObj = result.sharedObject;
                self.contentObj.shareCreatedAt = result.createdAt;
                self.expermentCreatorInfo.username = result.initiator.name;
                self.expermentCreatorInfo.avatar = result.initiator.avatar;
                self.emptyPageFun(false);
                self.setHeaderTitle(response.data.title);
                self.setHeaderTitle(self.contentObj.title);
              })
              .catch(error => {
                let type = error.response.data;
                self.emptyPageFun(false);
                return type === 'SharedAsset'
                  ? (self.sharedAsset = true)
                  : (self.sharedAsset = false);
              });
            break;
          default:
            break;
        }
      }
    });
  },
  data: {
    type: '',
    contentObj: {
      content: {
        previewHtml: ''
      }
    },
    tipsContentObj: {},
    shareTipsActive: false,
    sharedAsset: false,
    emptyPage: false,
    commentList: [],
    comment: {
      content: '',
      subTarget: {
        path: '',
        referer: ''
      },
      targetId: '',
      targetType: '',
      creatorInfo: {
        avatar: '',
        username: ''
      },
      textareaContent: '',
      atwhoView: false,
      AdditionalComments: [],
      active: true
    },
    mousedownTime: 0,
    mouseupTime: 0,
    menuShow: false,
    commentsBoxShow: false,
    experimentId: '',
    projectContributors: [],
    expermentCreatorInfo: {
      avatar: '',
      username: ''
    },
    userInfo: {},
    tipText: '',
    path: ' ',
    unreadCommentIds: []
  },
  computed: {
    createdAtTime() {
      return this.timeFun(this.contentObj.createdAt);
    },
    updatedAtTime() {
      return this.timeFun(this.contentObj.updatedAt);
    },
    shareCreatedAtTime() {
      return this.timeFun(this.contentObj.shareCreatedAt);
    },
    contentPreviewHtml() {
      return this.contentObj.content.previewHtml;
    },
    tipsTime() {
      let time = this.tipsContentObj.updatedAt;
      return this.timeFun(time);
    },
    trans() {
      let trans = {};
      let zh = language.indexOf('zh') >= 0;
      trans.experimentStatus = zh ? '( 实验进度 )' : '( experiment status )';
      trans.shareOrExport = zh ? '分享' : 'share';
      trans.shareErrTextOne = zh ? '你来晚了' : 'Ah, you are late';
      trans.shareErrTextTwo = zh
        ? '与您共享的文件已被取消。'
        : 'the file you have shared has been canceled.';
      trans.shareCopyLink = zh ? '链接复制成功！' : 'Copy link successful!';
      trans.insufficient = zh ? '权限不足！' : 'Insufficient permissions!';
      trans.commitNotFound = zh
        ? '此评论已删除,请刷新页面'
        : 'This comment has been deleted, please refresh the page!';
      trans.createdIn = zh ? '创建于' : 'created in';
      trans.UpdatedIn = zh ? '更新于' : 'Updated in';
      trans.markAllRead = zh ? '全部标记已读' : 'mark all read';
      trans.comment = zh ? '发表评论' : 'comment';
      return trans;
    },
    ideasContentInnerTextFun() {
      let reg = /<(?!a|\/?a|em|\/?em|strong|\/?strong).*?>/g;
      let content = this.tipsContentObj.content;
      let text = content ? content.previewHtml : '';
      let str = text.replace(reg, '');
      let removeIdeaCode = /class=\"ml-project-idea-hash-code\"/g;
      return str.replace(removeIdeaCode, '');
    },
    commentListShow() {
      let typeArry = ['', 'Idea'];
      return typeArry.includes(this.type) || this.commentList.length < 1
        ? true
        : false;
    },
    ability() {
      return this.userInfo.ability;
    }
  },
  mounted() {
    let self = this;
    $(document)
      .on('mouseenter', '.ml-project-idea-hash-code', function(event) {
        let tipsId = event.target.pathname.split('/');
        let payload = {
          projectId: urlPathArry[2],
          tipsId: tipsId[4]
        };
        switch (self.type) {
          case 'share':
            apiAxios
              .get(`/shares/${payload.projectId}/ideas/${payload.tipsId}`)
              .then(response => {
                self.tipsContentObj = response.data;
                self.tipsMouseover(event);
              })
              .catch(error => {});
            break;
          default:
            apiAxios
              .get(`/projects/${payload.projectId}/ideas/${payload.tipsId}`)
              .then(response => {
                self.tipsContentObj = response.data;
                self.tipsMouseover(event);
              })
              .catch(error => {});
            break;
        }
      })
      .on('mouseleave', '.ml-project-idea-hash-code', function(event) {
        $('.ideas-tips-mouseover')
          .delay(200)
          .hide(0);
      });
    $(document)
      .on('mouseenter', '.ideas-tips-mouseover', function(event) {
        $('.ideas-tips-mouseover').show(0);
      })
      .on('mouseleave', '.ideas-tips-mouseover', function(event) {
        $('.ideas-tips-mouseover').hide(0);
      });
    $('#m-share-content').click(() => {
      this.commentList.forEach(e => {
        this.$set(e, 'atwhoView', false);
      });
    });
  },
  methods: {
    commentsBoxOpen(type) {
      this.commentsBoxShow = type;
    },
    clickContent() {
      let createComment = document.querySelector('.create-comment');
      if (createComment.style.display === 'block') {
        return;
      }
      this.menuShow = false;
      let time = this.mouseupTime - this.mousedownTime;
      if (time < 200) {
        this.commentsBoxOpen(false);
      }
    },
    mousedown() {
      this.mousedownTime = event.timeStamp;
    },
    contextmenu(event) {
      if (this.type !== 'Experiment' || this.userInfo.ability !== 'Update')
        return;
      let nodeContentLeft = nodeContent.getBoundingClientRect().left;
      let getSelection = window.getSelection
        ? window.getSelection()
        : document.selection.createRange().text;
      let createComment = document.querySelector('.create-comment');
      let menu = document.querySelector('#menu');
      if (!getSelection.isCollapsed) {
        commentTitle = getSelection.toString();
        menu.style.left = event.clientX + 'px';
        menu.style.top = event.clientY + 'px';
        this.menuShow = true;
        this.commentsBoxOpen(false);
        createComment.style.display = 'none';
      }
    },
    mouseup(event) {
      this.mouseupTime = event.timeStamp;
      if (
        this.mouseupTime - this.mousedownTime < 200 ||
        this.type !== 'Experiment' ||
        this.userInfo.ability !== 'Update'
      ) {
        return;
      }
      let nodeContent = document.getElementById('nodeContent');
      let nodeContentLeft = nodeContent.getBoundingClientRect().left;
      let comments = document.querySelector('.comments-box');
      let createComment = document.querySelector('.create-comment');
      let getSelection = window.getSelection
        ? window.getSelection()
        : document.selection.createRange().text;

      let anchorNodeClassName = getSelection.anchorNode.parentElement.className;
      let focusNodeClassName = getSelection.focusNode.parentElement.className;

      let str = anchorNodeClassName + ' ' + focusNodeClassName;

      let indexOfParameter = str.indexOf('language-parameter');
      let indexOfResult = str.indexOf('language-result');

      if (indexOfParameter > -1 && indexOfResult < 0) {
        this.path = 'settings';
      } else if (indexOfParameter < 0 && indexOfResult > -1) {
        this.path = 'result';
      } else {
        this.path = 'content';
      }

      if (!getSelection.isCollapsed) {
        commentTitle = getSelection.toString();
        let left = 0;
        let top = 0;
        // 鼠标从左边开始

        if (getSelection.anchorOffset < getSelection.focusOffset) {
          left = event.pageX - nodeContentLeft;
          top = event.pageY - 82 - 52;
        } else {
          left = event.pageX - nodeContentLeft - 10;
          top = event.pageY - 82 - 52;
        }
        comments.style.left = left + 'px';
        comments.style.top = top + 'px';
        createCommentBoxStyle = {
          top: top,
          left: left
        };

        this.commentsBoxOpen(true);
        createComment.style.display = 'none';
        this.menuShow = false;
      }
    },
    createComments(type) {
      if (type === 'menu') {
        this.menuShow = false;
      }
      this.commentsBoxOpen(true);
      this.commentList.forEach(e => {
        this.$set(e, 'active', false);
      });
      let createComment = document.querySelector('.create-comment');
      createComment.style.top = createCommentBoxStyle.top + 'px';
      createComment.style.left = createCommentBoxStyle.left + 48 + 'px';

      createComment.style.display = 'block';

      let targetId = urlPathArry[4];

      this.comment = {
        content: '',
        subTarget: {
          path: this.path,
          referer: commentTitle
        },
        targetId: targetId,
        targetType: 'ProjectExperiment',
        creatorInfo: {
          avatar: userData.avatar,
          username: userData.username
        },
        textareaContent: '',
        atwhoView: false,
        AdditionalComments: [],
        active: true
      };
    },
    commentClick(id) {
      let createComment = document.querySelector('.create-comment');
      createComment.style.display = 'none';
      this.menuShow = false;
      this.commentsBoxOpen(false);
      this.commentList.forEach(e => {
        this.$set(e, 'atwhoView', false);
        if (e.id === id) {
          this.$set(e, 'active', true);
        } else {
          this.$set(e, 'active', false);
        }
      });
      let commentRead = this.commentList.find(x => x.id === id);
      let ids = [];
      ids.push(commentRead.id);
      this.$set(commentRead, 'unreadShow', false);
      if (commentRead.AdditionalComments.length > 0) {
        commentRead.AdditionalComments.forEach(e => {
          ids.push(e.id);
        });
      }
      this.readCommit(ids);
    },
    cancelCard(id) {
      this.commentList.forEach(e => {
        this.$set(e, 'active', false);
      });
    },

    async getContributors(projectId) {
      let resData = await apiAxios.get(`/projects/${projectId}/contributors`);
      this.projectContributors = resData.data;
      this.userInfo = resData.data.find(x => x.id === userData.id);
      this.getCommentList();
    },

    async getCommentList() {
      if (this.type !== 'Experiment') return;

      let targetId = urlPathArry[4];
      let resCommentList = await apiAxios.get(`/comments?targetId=${targetId}`);
      let commentList = resCommentList.data;

      let usersCommentList = await apiAxios.get(
        `/users/comments?targetId=${targetId}`
      );
      usersCommentList = usersCommentList.data;

      let mailReg = /^\+([a-zA-Z]|[0-9])(\w|\-)+@[a-zA-Z0-9]+\.([a-zA-Z]{2,4})$/;

      let aboutmeIds = []; // @ 我的 commit id
      let unreadIds = []; // 未读 commit id

      usersCommentList.forEach(comment => {
        if (
          comment.targetType === 'ProjectExperiment' &&
          comment.aboutme.length > 0
        ) {
          comment.aboutme.forEach(e => {
            if (e.cause === 'Assign') {
              aboutmeIds.push(e.id);
            }
          });
        }
        if (comment.targetType === 'Comment' && comment.aboutme.length > 0) {
          comment.aboutme.forEach(e => {
            if (e.cause === 'Assign') {
              aboutmeIds.push(comment.targetId);
            }
          });
        }
        unreadIds = unreadIds.concat(comment.unread);
      });

      commentList.forEach(comment => {
        let creatorInfo = this.projectContributors.find(
          x => x.id === comment.creator
        );
        comment.createdAt = this.timeFun(comment.createdAt);
        this.$set(comment, 'creatorInfo', creatorInfo);
        let contentArry = comment.content ? comment.content.split(' ') : [];
        if (unreadIds.length > 0 && unreadIds.includes(comment.id)) {
          this.$set(comment, 'unreadShow', true);
        }
        contentArry.forEach((e, index) => {
          if (mailReg.test(e)) {
            let newContent = '<strong>' + e + '</strong';
            contentArry.splice(index, 1, newContent);
          }
        });
        comment.content = contentArry.join(' ');
      });

      let firstCommentList = commentList.filter(
        x => x.targetType === 'ProjectExperiment'
      );
      let AddCommentList = commentList.filter(x => x.targetType === 'Comment');

      firstCommentList.forEach(l => {
        this.$set(l, 'textareaContent', '');
        l.AdditionalComments = [];
        if (aboutmeIds.includes(l.id)) {
          this.$set(l, 'assign', true);
        }
        AddCommentList.forEach((j, index) => {
          if (l.id === j.targetId) {
            l.AdditionalComments.push(j);
          }
        });
      });
      this.commentList = firstCommentList;
      this.unreadCommentIds = unreadIds;
    },

    async updateComment(event) {
      await this.getCommentList();

      let ids = [];
      ids.push(event.id);
      this.readCommit(ids);

      this.commentList.forEach(e => {
        this.$set(e, 'active', false);
      });

      if (event.targetType === 'ProjectExperiment') {
        this.commentList.forEach(e => {
          if (e.id === event.id) {
            this.$set(e, 'active', true);
          }
        });
        let container = this.$el.querySelector('.m-node-comments-list ul');
        $('.m-node-comments-list ul').animate(
          { scrollTop: container.scrollHeight + 'px' },
          800
        );
      } else {
        this.commentList.forEach(e => {
          if (e.id === event.targetId) {
            this.$set(e, 'active', true);
          }
        });
      }
    },

    readCommit(ids) {
      ids.forEach(commentId => {
        if (this.unreadCommentIds.includes(commentId)) {
          let data = { status: 'Read' };
          apiAxios
            .patch(`/users/comments/${commentId}`, data)
            .then(res => {
              this.commentList.forEach(e => {
                if (e.id === commentId) {
                  this.$set(e, 'unreadShow', false);
                }
                if (e.AdditionalComments.length > 0) {
                  e.AdditionalComments.forEach(commit => {
                    if (commit.id === commentId) {
                      this.$set(commit, 'unreadShow', false);
                    }
                  });
                }
              });

              let unreadCommentIds = this.unreadCommentIds.filter(
                x => x !== commentId
              );
              this.unreadCommentIds = unreadCommentIds;
            })
            .catch(err => {
              console.log(err);
            });
        }
      });
    },

    allRead() {
      this.readCommit(this.unreadCommentIds);
      this.commentList.forEach(c => {
        this.$set(c, 'unreadShow', false);
        if (c.AdditionalComments.length > 0) {
          c.AdditionalComments.forEach(comment => {
            this.$set(comment, 'unreadShow', false);
          });
        }
      });
    },

    deleteComent(id) {
      this.commentList.forEach(e => {
        if (e.id === id) {
          this.$set(e, 'opacity', true);
        }
      });

      let list = this.commentList.find(x => x.id === id);
      if (list.AdditionalComments.length > 0) {
        list.AdditionalComments.forEach(comment => {
          this.deleteCommentApi(comment.id, comment.targetType);
        });
      }
      this.deleteCommentApi(list.id, list.targetType);
    },

    deleteCommentApi(id, type) {
      apiAxios
        .delete(`/comments/${id}`)
        .then(res => {
          if (type === 'ProjectExperiment') {
            setTimeout(() => {
              this.commentList.splice(
                this.commentList.findIndex(item => item.id === id),
                1
              );
            }, 500);
          }
        })
        .catch(err => {});
    },

    emptyPageFun(status) {
      setTimeout(() => {
        this.emptyPage = status;
      }, 500);
    },
    timeFun(time) {
      language.indexOf('zh') >= 0
        ? moment.locale('zh-cn')
        : moment.locale('en');
      return moment(time).format('MMM Do YYYY HH:mm:ss');
    },
    aOnClick(evt) {
      let elt = evt.target;
      while (elt !== this.$el) {
        if (
          elt.href &&
          elt.href.match(/^((https|http|ftp|rtsp|mms)?:\/\/)[^\s]+/) &&
          (!elt.hash || elt.href.slice(0, appUri.length) !== appUri)
        ) {
          evt.preventDefault();
          const wnd = window.open(elt.href, '_blank');
          wnd.focus();
          return;
        }
        elt = elt.parentNode;
      }
    },
    onCopy(e) {
      let self = this;
      switch (self.type) {
        case 'Experiment':
          let payload = {
            project: urlPathArry[2],
            id: urlPathArry[4],
            type: 'Experiment'
          };
          apiAxios
            .post('/shares', payload)
            .then(res => {
              this.$copyText(res.data).then(
                function(e) {
                  self.shareTipsActiveOpen('share');
                },
                function(e) {}
              );
            })
            .catch(error => {
              console.log(error);
            });
          break;
        case 'share':
          let shareId = urlPathArry[2];
          apiAxios
            .post(`/shares/${shareId}`)
            .then(res => {
              this.$copyText(res.data).then(
                function(e) {
                  self.shareTipsActiveOpen('share');
                },
                function(e) {}
              );
            })
            .catch(error => {});
          break;
      }
    },

    shareTipsActiveOpen(type) {
      this.tipText =
        type === 'share'
          ? this.trans.shareCopyLink
          : type === 'insufficient'
          ? this.trans.insufficient
          : this.trans.commitNotFound;
      this.shareTipsActive = true;
      setTimeout(() => {
        this.shareTipsActive = false;
      }, 3000);
    },

    async expermentOrIdeas(payload) {
      this.type = payload.type;
      await this.getContributors(payload.project);
      apiAxios
        .get(`/projects/${payload.project}/${payload.code}/${payload.id}`)
        .then(response => {
          let experment = response.data;
          this.expermentCreatorInfo = this.projectContributors.find(
            x => x.id === experment.creator
          );
          this.contentObj = experment;
          this.emptyPageFun(false);
          this.setHeaderTitle(experment.title);
          this.experimentId = experment.id;
        })
        .catch(error => {
          console.log(error);
        });
    },
    setHeaderTitle(title) {
      document.title = title;
    },
    tipsMouseover(event) {
      let topStyle = event.target.getBoundingClientRect().top - 10;
      let leftStyle =
        event.target.getBoundingClientRect().left -
        event.target.offsetWidth / 2 -
        10;
      if (event.clientY < 150) {
        $('.ideas-tips-mouseover')
          .css({
            top: topStyle + 38,
            bottom: '',
            left: leftStyle
          })
          .addClass('bottom-active');
      } else {
        $('.ideas-tips-mouseover')
          .css({
            top: '',
            bottom: 'calc(100vh - ' + topStyle + 'px)',
            left: leftStyle
          })
          .removeClass('bottom-active');
      }
      $('.ideas-tips-mouseover').show(0);
    }
  }
});
