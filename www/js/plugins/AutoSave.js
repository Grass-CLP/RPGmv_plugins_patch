/*
AutoSave
*/

(function() {
	//****************************************************************************
	//自动保存处理 	
	//****************************************************************************
	//存档文件扩展
	//****************************************************************************
	
	//在手动保存的ID（0）追加 
	
	//（改写）自动保存的场所通常不能保存
	Scene_Save.prototype.onSavefileOk = function() {
		Scene_File.prototype.onSavefileOk.call(this);
		$gameSystem.onBeforeSave();
		//if (DataManager.saveGame(this.savefileId())) {
		if ( this.savefileId() != 1 && DataManager.saveGame(this.savefileId())) {
			this.onSaveSuccess();
		} else {
			this.onSaveFailure();
		}
	};
	
	//（改写）自动保存的ID分钟改变
	Scene_Save.prototype.firstSavefileIndex = function() {
		return (DataManager.lastAccessedSavefileId() - 1) > 1 ? DataManager.lastAccessedSavefileId() - 1 : 1;
	};
	
	//（改写）自动保存的场所通常不能保存（灰色符号）。
	Window_SavefileList.prototype.drawItem = function(index) {
		var id = index + 1;
		var valid = DataManager.isThisGameFile(id);
		var info = DataManager.loadSavefileInfo(id);
		var rect = this.itemRectForText(index);
		this.resetTextColor();
		if (this._mode === 'load') {
			this.changePaintOpacity(valid);
		}else if (id == 1) {
			this.changePaintOpacity(false);
		}
		this.drawFileId(id, rect.x, rect.y);
		if (info) {
			this.changePaintOpacity(valid);
			this.drawContents(info, rect, valid);
			this.changePaintOpacity(true);
		}
		this.changePaintOpacity(true);
	};
	
	//（更新）Auto Svae标记的变更
	Window_SavefileList.prototype.drawFileId = function(id, x, y) {
		//this.drawText(TextManager.file + ' ' + id, x, y, 180);
		if( id == 1 ){
			this.drawText('Auto Save', x, y, 180);
		}else{
			this.drawText(TextManager.file + ' ' + (id-1), x, y, 180);
		}
	};
	
	//更改文件名。
	StorageManager.localFilePath = function(savefileId) {
		var name;
		if (savefileId < 0) {
			name = 'config.rpgsave';
		} else if (savefileId === 0) {
			name = 'global.rpgsave';
		} else {
			if (Math.floor(savefileId) === savefileId) {
				name = 'file%1.rpgsave'.format(savefileId-1);
			} else {
				name = 'file%1.rpgsave'.format(savefileId);
			}
		}
		return this.localFileDirectoryPath() + name;
	};
	
	//光标的开始位置保存（自动保存没有反应） 
	DataManager.saveGameWithoutRescue = function(savefileId) {
		var json = JsonEx.stringify(this.makeSaveContents());
		if (json.length >= 200000) {
			console.warn('Save data too big!');
		}
		StorageManager.save(savefileId, json);
		if(savefileId != 1) this._lastAccessedId = savefileId;
		var globalInfo = this.loadGlobalInfo() || [];
		globalInfo[savefileId] = this.makeSavefileInfo();
		this.saveGlobalInfo(globalInfo);
		return true;
	};
	
	//光标的开始位置（自动保存没有反应）
	DataManager.latestSavefileId = function() {
		var globalInfo = this.loadGlobalInfo();
		var savefileId = 1;
		var timestamp = 0;
		if (globalInfo) {
			//for (var i = 1; i < globalInfo.length; i++) {
			for (var i = 2; i < globalInfo.length; i++) {
				if (this.isThisGameFile(i) && globalInfo[i].timestamp > timestamp) {
					timestamp = globalInfo[i].timestamp;
					savefileId = i;
				}
			}
		}
		return savefileId;
	};
	
	
	//插入式命令扩展
	var _TS_autosave_Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
	Game_Interpreter.prototype.pluginCommand = function (command, args) {
		_TS_autosave_Game_Interpreter_pluginCommand.call(this, command, args);
		if (command === 'AutoSave') {
			//回想模式不允许AutoSave
			if (!$gameSwitches.value(170)) {
				$gameSystem.onBeforeSave();
				DataManager.saveGame(1);
			}
		}
	};
})();
