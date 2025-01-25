<template>
	<view class="container">
		<view v-if="isAdmin">
			<view class="upload-section">
				<button class="upload-btn" @tap="chooseImage">选择图片</button>
				<view class="preview" v-if="tempFilePath">
					<image :src="tempFilePath" mode="aspectFit"></image>
				</view>
			</view>
			<view class="form-section">
				<view class="form-item">
					<text>标题：</text>
					<input v-model="title" placeholder="请输入标题"/>
				</view>
				<view class="form-item">
					<text>分类：</text>
					<picker @change="bindPickerChange" :value="typeIndex" :range="typeArray" range-key="name">
						<view class="picker">{{typeArray[typeIndex].name}}</view>
					</picker>
				</view>
				<button class="submit-btn" @tap="uploadImage" :disabled="!tempFilePath">上传图片</button>
			</view>
		</view>
		<view v-else class="no-permission">
			<text>抱歉，只有管理员才能上传图片</text>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			isAdmin: false,
			tempFilePath: '',
			title: '',
			typeIndex: 0,
			typeArray: [
				{ id: 98, name: '小姐姐' },
				{ id: 101, name: '小哥哥' },
				{ id: 104, name: '精品头像' }
			]
		}
	},
	onLoad() {
		// 检查是否是管理员
		const userInfo = uni.getStorageSync("userinfo");
		if (userInfo && userInfo.user_id === 1) {
			this.isAdmin = true;
		} else {
			uni.showToast({
				title: '无权限访问',
				icon: 'none',
				duration: 2000,
				complete: () => {
					setTimeout(() => {
						uni.navigateBack();
					}, 2000);
				}
			});
		}
	},
	methods: {
		// 选择图片
		chooseImage() {
			uni.chooseImage({
				count: 1,
				sizeType: ['compressed'],
				sourceType: ['album', 'camera'],
				success: (res) => {
					this.tempFilePath = res.tempFilePaths[0]
				}
			})
		},
		
		// 分类选择
		bindPickerChange(e) {
			this.typeIndex = e.detail.value
		},
		
		// 上传图片
		async uploadImage() {
			if (!this.tempFilePath) {
				uni.showToast({
					title: '请选择图片',
					icon: 'none'
				})
				return
			}
			
			uni.showLoading({
				title: '上传中...'
			})
			
			try {
				// 1. 上传图片到云存储
				const cloudPath = `wallpapers/${Date.now()}-${Math.random().toString(36).slice(-6)}.jpg`
				const uploadRes = await wx.cloud.uploadFile({
					cloudPath,
					filePath: this.tempFilePath
				})
				
				// 2. 保存信息到数据库
				const result = await wx.cloud.callFunction({
					name: 'wallpaper',
					data: {
						action: 'addWallpaper',
						data: {
							title: this.title,
							type: this.typeArray[this.typeIndex].id,
							fileID: uploadRes.fileID,
							createTime: new Date()
						}
					}
				})
				
				if (result.result.code === 0) {
					uni.showToast({
						title: '上传成功',
						icon: 'success'
					})
					// 清空表单
					this.tempFilePath = ''
					this.title = ''
					this.typeIndex = 0
				} else {
					throw new Error('上传失败')
				}
			} catch (err) {
				console.error(err)
				uni.showToast({
					title: '上传失败',
					icon: 'none'
				})
			} finally {
				uni.hideLoading()
			}
		}
	}
}
</script>

<style>
.container {
	padding: 20rpx;
}
.upload-section {
	margin-bottom: 30rpx;
}
.preview {
	margin-top: 20rpx;
	width: 100%;
	height: 400rpx;
	background-color: #f8f8f8;
}
.preview image {
	width: 100%;
	height: 100%;
}
.form-section {
	background-color: #fff;
	padding: 20rpx;
	border-radius: 10rpx;
}
.form-item {
	display: flex;
	align-items: center;
	margin-bottom: 20rpx;
	padding: 10rpx 0;
}
.form-item text {
	width: 120rpx;
}
.picker {
	flex: 1;
}
.submit-btn {
	margin-top: 30rpx;
	background-color: #007AFF;
	color: #fff;
}
.submit-btn[disabled] {
	background-color: #ccc;
}
.no-permission {
	display: flex;
	justify-content: center;
	align-items: center;
	height: 100vh;
}
</style> 