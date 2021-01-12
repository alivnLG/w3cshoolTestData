const commentCard = {
  template: `<div class="item-comments">
              <div class="delete" @click.stop="deleteComent(comment.id)">
                <div class="mdi mdi-do-not-disturb"></div>
              </div>
              <div class="arrow-90"></div>
              <div class="arrow-45"></div>
              <div class="assigned-to">
                Assigned to you
              </div>
              <div class="header" @mouseenter="tipsEnter($event)" @mouseleave="tipsLeave()">
                <div class="comment-title">
                  <div class="title-comment" v-text="subTarget.referer"></div>
                  <div class="comment-title-tips" ref="commentTitleTips" :class="tips.classBottom"  :style="{ top: tips.top + 'px', visibility: tips.visibility }">
                    <div class="box">
                      <div class="text" v-text="subTarget.referer"></div>
                      <div class="arrow-down"></div>
                    </div>
                  </div>
                </div>
              
              </div>
              <div class="main">
                <div class="comment-list">
                  <div class="list-reviewers" v-if="creatorInfo">
                    <div class="avator">
                      <img :src="creatorInfo.avatar" />
                    </div>
                    <div class="info">
                      <div class="name" v-text="creatorInfo.username"></div>
                      <div class="time" v-text="comment.createdAt"></div>
                    </div>
                    <div class="unread" v-if="comment.unreadShow && type === 'Comment'"><span></span></div>
                  </div>
                  <div class="comment-content content-strong" v-html="comment.content"></div>
                </div>
                <div class="comment-list" v-for="(item, index) in AdditionalComments" :key="index">
                  <div class="list-reviewers" v-if="item.creatorInfo">
                    <div class="avator">
                      <img :src="item.creatorInfo.avatar" />
                    </div>
                    <div class="info">
                      <div class="name" v-text="item.creatorInfo.username"></div>
                      <div class="time" v-text="item.createdAt"></div>
                    </div>
                    <div class="unread" v-if="item.unreadShow"><span></span></div>
                  </div>
                  <div class="comment-content content-strong" v-html="item.content"></div>
                </div>
              </div>
              <div class="footer" :class="{ 'footer-active': comment.active }">
                <textarea
                  v-model="comment.textareaContent"
                  v-on:input="inputFunc($event)"
                  class="comment-textarea"
                  ref="commentTextarea"
                  type="text"
                  @keydown="atwhoKey($event)"

                  placeholder="write something here…"
                ></textarea>
                <div class="atwho-view" v-if="comment.atwhoView" :style="{top: atwhoView.top,left: atwhoView.left,width: atwhoView.width}">
                  <div class="atwho-header">
                    {{trans.chooseList}}<small>↑&nbsp;↓&nbsp;</small>
                  </div>
                  <ul class="atwho-view-ul">
                    <li v-for="item in contributorslist" :key="item.id" 
                      :class="{'cur': item.active}" @click.stop="atwhoClick(item.email)">{{item.username}} <small>{{item.email}}</small></li>
                  </ul>
                </div>
                <div class="buttons">
                  <div class="btn" @click.stop="comments" v-text="trans.comment"></div>
                  <div class="btn cancel" @click.stop="cancel(comment.id)" v-text="trans.cancel"></div>
                </div>
              </div>
            </div>`, // 组件的html结构,
  props: {
    comment: {
      type: Object
    },
    type: {
      type: String
    },
    targetid: {
      type: String
    },
    ability: {
      type: String
    },
    contributorslist: {
      type: Array
    }
  },
  data() {
    return {
      deleteShow: false,
      atwhoView: {
        top: 50 + 'px',
        left: 16 + 'px',
        width: 286 + 'px'
      },
      textareaTarget: {},
      keyIndex: -1,
      keymail: '',
      tips: {
        show: false,
        top: 0,
        visibility: 'hidden',
        classBottom: ''
      }
    };
  },
  mounted() {
    let textarea = this.$refs.commentTextarea;
    this.makeExpandingArea(textarea);
  },
  computed: {
    creatorInfo() {
      return this.comment.creatorInfo;
    },
    subTarget() {
      return this.comment.subTarget;
    },
    AdditionalComments() {
      return this.comment.AdditionalComments;
    },
    trans() {
      let trans = {};
      let zh = language.indexOf('zh') >= 0;
      trans.comment = zh ? '发表评论' : 'comment';
      trans.cancel = zh ? '取消' : 'cancel';
      trans.chooseList = zh ? '选择列表' : 'Choose List';
      return trans;
    }
  },
  methods: {
    tipsEnter(event) {
      if (!this.comment.active) return;
      let commentTitleTips = this.$refs.commentTitleTips;
      let classBottom = '';
      let top = 0;
      let show = true;

      if (event.target.getBoundingClientRect().top < 162) {
        top = event.target.getBoundingClientRect().height - 20;
        classBottom = 'bottom';
      } else {
        top = -(commentTitleTips.offsetHeight + 10);
        classBottom = '';
      }
      this.tips = {
        show: show,
        top: top,
        visibility: 'unset',
        classBottom: classBottom
      };
    },
    tipsLeave() {
      this.tips = {
        show: false,
        top: 0,
        visibility: 'hidden',
        classBottom: ''
      };
    },
    makeExpandingArea(el) {
      el.addEventListener(
        'input',
        function() {
          el.style.height = 'auto';
          el.style.height = el.scrollHeight + 'px';
        },
        false
      );
    },
    cancel(id) {
      if (this.type === 'ProjectExperiment') {
        let createComment = document.querySelector('.create-comment');
        createComment.style.display = 'none';
        this.$parent.commentsBoxOpen(false);
      } else {
        this.$parent.cancelCard(id);
      }
      this.comment.textareaContent = '';
      const textarea = this.$refs.commentTextarea;
      textarea.style.height = 'auto';
    },
    async atwhoClick(email) {
      const textarea = this.$refs.commentTextarea;

      this.comment.textareaContent =
        this.textareaTarget.textareaValue.substring(
          0,
          this.textareaTarget.startPos - 1
        ) +
        '+' +
        email +
        ' ' +
        this.textareaTarget.textareaValue.substring(
          this.textareaTarget.endPos,
          this.textareaTarget.textareaValue.length
        );
      await this.$nextTick();
      textarea.focus();
      this.comment.atwhoView = false;
      textarea.style.height = 'auto';
      textarea.style.height = textarea.scrollHeight + 'px';
    },
    atwhoKey(event) {
      if (!this.comment.atwhoView) return;
      let keyDownIndex = this.keyIndex;
      switch (event.keyCode) {
        case 40:
          event.preventDefault();
          this.contributorslist.forEach((e, index) => {
            if (keyDownIndex === this.contributorslist.length - 1) return;
            this.$set(e, 'active', false);
            if (index === this.keyIndex + 1) {
              this.$set(e, 'active', true);
              keyDownIndex = index;
              this.keymail = e.email;
            }
          });
          break;
        case 38:
          event.preventDefault();
          this.contributorslist.forEach((e, index) => {
            if (this.keyIndex === 0) return;
            this.$set(e, 'active', false);
            if (index === this.keyIndex - 1) {
              this.$set(e, 'active', true);
              keyDownIndex = index;
              this.keymail = e.email;
            }
          });
          break;
        case 13:
          event.preventDefault();
          this.atwhoClick(this.keymail);
          break;
      }

      this.keyIndex = keyDownIndex;
    },
    inputFunc(event) {
      this.keymail = '';
      this.keyIndex = -1;
      this.contributorslist.forEach(e => {
        this.$set(e, 'active', false);
      });

      let target = event.target;
      let startPos = target.selectionStart;
      let endPos = target.selectionEnd;
      let textareaValue = target.value;

      this.textareaTarget = {
        startPos: startPos,
        endPos: endPos,
        textareaValue: textareaValue
      };

      let str = textareaValue.substring(0, startPos);
      let lastStr2 = str.charAt(str.length - 2);

      if (event.data !== '@') {
        this.comment.atwhoView = false;
        return;
      }

      if (lastStr2 === ' ' || lastStr2 === '\n' || textareaValue.length === 1) {
        this.comment.atwhoView = true;
        this.atwhoView = {
          top: target.offsetHeight + 5 + 'px',
          left: target.offsetLeft + 'px',
          width: target.offsetWidth + 'px'
        };
      }
    },
    comments() {
      if (this.ability !== 'Update' && this.type === 'ProjectExperiment') {
        this.$parent.shareTipsActiveOpen('insufficient');
        return;
      }
      if (this.comment.textareaContent === '') return;

      let targetId =
        this.type === 'ProjectExperiment' ? this.targetid : this.comment.id;
      let payload = {
        content: this.comment.textareaContent,
        subTarget: {
          path: this.comment.subTarget.path,
          referer: this.comment.subTarget.referer
        },
        targetId: targetId,
        targetType: this.type
      };

      apiAxios
        .post('/comments', payload)
        .then(res => {
          this.$emit('comment', res.data);
          let createComment = document.querySelector('.create-comment');
          createComment.style.display = 'none';
          this.$parent.commentsBoxOpen(false);
          this.comment.textareaContent = '';
        })
        .catch(err => {
          if (err.response.status === 422) {
            this.$parent.shareTipsActiveOpen('');
          }
        });
    },
    deleteComent(id) {
      if (this.ability !== 'Update') {
        this.$parent.shareTipsActiveOpen('insufficient');
        return;
      }
      this.$parent.deleteComent(id);
    }
  }
};
