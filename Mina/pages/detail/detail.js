const utils = require('../../utils/utils');
const conf = require('../../utils/conf');
var WxParse = require('../../wxParse/wxParse.js');

Page({
  data: {
    autoplay: false,
    vid: '',
    scrollTop: 0,
    curvideo: '',
    curtitle: '',
    cursummary: '',
    curPro: '',
    ramDataArr: '',
    listAlbum: '',
    listRecom: '',
    iconlike: 'd',
    loadst: 'loading'
  },
  onShareAppMessage: function () {
    return {
      title: this.data.curtitle,
      path: '/pages/detail/detail?vid='+this.data.vid
    }
  },
  onLoad:function(options){
      var that = this;
      // var options = options || {}; options.cid = '2G2BNiWtfbB14Fi8';// debug model
      if(options.cid){
          //拉取专辑列表
          var cid = options.cid;
          wx.request({
            url: conf.apiURL+'/video/get',
            data: {
                cid: cid,
                t: new Date().getTime()
            },
            method: 'GET',
            success: function(res){
              var curdata = res.data,
                  vid = curdata[0].vid;

              //写入同系列是否有收藏的对象字段
              var likelist = wx.getStorageSync('likelist') || [];
              for(let k = 0;k < curdata.length;k ++){
                if('liked' == utils.likeStatus(curdata[k].vid, likelist)){
                  curdata[k].like = true
                }else{
                  curdata[k].like = false
                }
              }

              let adetail = curdata[0].artistinfo.adetail;
              WxParse.wxParse('adetail', 'html', adetail, that, 0);

              that.setData({
                  cid: cid,
                  listAlbum: curdata,
                  vid: vid,
                  artistinfo: curdata[0].artistinfo,
                  curvideo: curdata[0].source,
                  curtitle: curdata[0].title,
                  cursummary: curdata[0].content,
                  curPro: curdata[0].production,
                  playcount: utils.numconvert(curdata[0].playcount),
                  loadst: "normal"
              });

              //设置标题栏提示
              wx.setNavigationBarTitle({
                title: curdata[0].title
              });

              // 检查当前项有没有收藏过
              utils.reqLikeSt("likelist", vid, function(){
                that.setData({
                  iconlike: 'cur'
                });
              });

              //检查wifi情况
              // wx.getNetworkType({
              //   success: function(res) {
              //     // wifi/2g/3g/4g/unknown(Android下不常见的网络类型)/none(无网络)
              //     var networkType = res.networkType

              //     if(networkType === 'wifi'){
              //       //如果检测到WIFI网络环境自动播放，并写入storage计算播放过
              //       that.setData({
              //         autoplay: !that.data.autoplay
              //       });

              //       //记录到hisStorage观看记录
              //       utils.setStorage(vid);

              //     }
              //   }
              // });

              //把当前专辑信息存储在本地
              utils.setAlbumList(cid, curdata);

            },
            fail: function() {
                wx.showToast({
                  title: '请求数据错误~',
                  icon: 'loading'
                });
                that.setData({
                  loadst: 'fail'
                });
            }
          });
      }else if(options.vid){
          //拉取单个视频
          var vid = options.vid;
          wx.request({
            url: conf.apiURL+'/video/get',
            data: {
                vid: vid,
                plus: 'album',
                t: new Date().getTime()
            },
            method: 'GET',
            success: function(res){
              var curdata = res.data,
                  cid = curdata['cid'],
                  albumvlist = curdata['albumvlist'];

              //写入同系列是否有收藏的对象字段
              var likelist = wx.getStorageSync('likelist') || [];
              for(let k = 0;k < albumvlist.length;k ++){
                if('liked' == utils.likeStatus(albumvlist[k].vid, likelist)){
                  albumvlist[k].like = true
                }else{
                  albumvlist[k].like = false
                }
              }

              let adetail = curdata.artistinfo.adetail;
              WxParse.wxParse('adetail', 'html', adetail, that, 0);
              that.setData({
                  cid: cid,
                  listAlbum: albumvlist,
                  vid: vid,
                  artistinfo: curdata.artistinfo,
                  curvideo: curdata.source,
                  curtitle: curdata.title,
                  cursummary: curdata.content,
                  curPro: curdata.production,
                  playcount: utils.numconvert(curdata.playcount),
                  loadst: "normal"
              });

              //设置标题栏提示
              wx.setNavigationBarTitle({
                title: curdata.title
              });

              // 检查当前项有没有收藏过
              utils.reqLikeSt("likelist", vid, function(){
                that.setData({
                  iconlike: 'cur'
                });
              });
            },
            fail: function() {
                wx.showToast({
                  title: '请求数据错误~',
                  icon: 'loading'
                });
                that.setData({
                  loadst: 'fail'
                });
            }
          })
      }else{
        //没有参数跳转到栏目汇总
        wx.redirectTo({
          url: '../discover/discover'
        });
        return;
      }
      //请求全部专辑列表，并做随机打散显示 {{#专辑推荐区}}  —— 这里要做个本地缓存，减少一次请求
      wx.request({
        url: conf.apiURL+'/album/get',
        data: {
          t: new Date().getTime()
        },
        method: 'GET',
        success: function(res){
            //随机打乱，截取前五个数组
            var newDataArr = res['data'].sort(function(){
                    return 0.5 - Math.random();
                }).slice(0).splice(0, 5);
            that.setData({
              ramDataArr: newDataArr
            });
        },
        fail: function() {
          wx.showToast({
            title: '请求数据错误~',
            icon: 'loading'
          });
          that.setData({
            loadst: 'fail'
          });
        }
      });
      
  },
  getdetail: function(e){
    var vid = e.currentTarget.dataset.vid,
        listAlbum = this.data.listAlbum,
        that = this;

    that.setData({
      vid: vid,
      iconlike: 'd'
    });

    for(let i = 0; i < listAlbum.length;i++){
      if(vid === listAlbum[i].vid){

        //更新标题栏
        wx.setNavigationBarTitle({
          title: listAlbum[i].title
        });

        //目前同一个专辑里面的艺人都是相同的，不做处理，以后不排除专辑内有多个艺人数据
        // let adetail = listAlbum[i].artistinfo.adetail;
        // WxParse.wxParse('adetail', 'html', adetail, that, 0);

        this.setData({
          curvideo: listAlbum[i].source,
          curtitle: listAlbum[i].title,
          cursummary: listAlbum[i].content,
          artistinfo: listAlbum[i].artistinfo,
          curPro: listAlbum[i].production,
          playcount: utils.numconvert(listAlbum[i].playcount)
        });
      }
    };

    //检查有没有收藏过
    utils.reqLikeSt("likelist", vid, function(){
      that.setData({
        iconlike: 'cur'
      });
    });

    // wx.getNetworkType({
    //   success: function(res) {
    //     var networkType = res.networkType
    //     if(networkType === 'wifi'){
    //       //如果检测到WIFI网络环境自动播放，并写入storage计算播放过
    //       that.setData({
    //         autoplay: true
    //       });

    //       //记录到hisStorage观看记录
    //       utils.setStorage(vid);

    //     }
    //   }
    // });
  },
  getAlbum: function(e){
    var cid = e.currentTarget.dataset.cid;

    wx.redirectTo({
      url: '../detail/detail?cid=' + cid
    });

  },
  likeit: function(e){
    // wx.removeStorageSync('likelist');return; //调试清理本地缓存
    // this.data.iconlike === "d" ? this.setData({iconlike: 'cur'}) : this.setData({iconlike: 'd'});

    if(this.data.iconlike === 'cur'){
      wx.showToast({
        title: '已经收藏过了',
        icon: 'loading',
        mask: true
      });
      return;
    }

    var vid = this.data.vid,
        time = new Date().getTime(),
        arr = [],
        obj = {};
    if(wx.getStorageSync('likelist')){
      var likelist = wx.getStorageSync('likelist');

      if('liked' !== utils.likeStatus(vid, likelist)){
        obj.vid = vid;
        obj.time = time;
        likelist.push(obj);
        wx.setStorageSync('likelist', likelist);
      }

    }else{
      obj.vid = vid;
      obj.time = time;
      arr.push(obj)
      wx.setStorageSync('likelist', arr);
    }
    this.setData({iconlike: 'cur'});
    wx.showToast({
      title: '收藏成功',
    });
  },
  listlike: function(e){
    // var vid = e.currentTarget.id,
    //     index = e.currentTarget.dataset['index'],
    //     that = this,
    //     listAlbum = this.data.listAlbum;

    // if(!listAlbum[index].like){
    //     listAlbum[index].like = true;
    //     that.setData({
    //       listAlbum: listAlbum
    //     });

    //     //这里接着可以写入接口，或者存入wx.getStorageSync('likelist')
    // }else{
    //     //点击过收藏的就不再操作
    //     wx.showToast({
    //       title: '已经收藏过了',
    //       icon: 'loading',
    //       mask: true
    //     });
    //     return;
    // }    
  },
  bindplay: function(e){
    var pc = this.data.playcount,
        pc = Number(pc.replace(',', '')),
        obj = {
          vid : this.data.vid,
          playcount : pc
        },
        that = this;
    //记录到playvideo()观看记录，点击播放触发
    utils.playvideo(obj, function(res){
      that.setData({
        playcount: utils.numconvert(pc + 1)
      });
    });

  },
  showmore: function(){
    this.setData({
      expand: 'open'
    })
  },
  showartist: function(){
    this.setData({
      exArtist: 'open'
    })
  },
  closeartist: function(){
    this.setData({
      exArtist: ''
    })
  }
})