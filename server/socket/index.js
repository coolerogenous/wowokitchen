const { Party, PartyDish, Dish } = require('../models');
const calculationEngine = require('../services/calculationEngine');

/**
 * Socket.IO 事件处理
 * 用于饭局模式的实时同步
 */
module.exports = function setupSocket(io) {
    io.on('connection', (socket) => {
        console.log('用户已连接:', socket.id);

        // 加入饭局房间
        socket.on('party:join', async ({ share_code, nickname }) => {
            try {
                const party = await Party.findOne({ where: { share_code } });
                if (!party) {
                    socket.emit('error', { message: '饭局不存在' });
                    return;
                }
                socket.join(`party:${share_code}`);
                socket.share_code = share_code;
                socket.nickname = nickname || '匿名';

                // 广播有人加入
                io.to(`party:${share_code}`).emit('party:userJoined', {
                    nickname: socket.nickname,
                    message: `${socket.nickname} 加入了饭局`,
                });
            } catch (error) {
                console.error('加入饭局失败:', error);
                socket.emit('error', { message: '加入失败' });
            }
        });

        // 添加菜品
        socket.on('party:addDish', async ({ share_code, dish_id, added_by, servings }) => {
            try {
                const party = await Party.findOne({ where: { share_code } });
                if (!party || party.status === 'locked') {
                    socket.emit('error', { message: '饭局已锁定或不存在' });
                    return;
                }

                await PartyDish.create({
                    party_id: party.id,
                    dish_id,
                    added_by: added_by || '匿名',
                    servings: servings || 1,
                });

                const budget = await calculationEngine.calculatePartyBudget(party.id);
                await party.update({ total_budget: budget });

                // 广播更新
                io.to(`party:${share_code}`).emit('party:update', {
                    total_budget: budget,
                    action: 'addDish',
                    added_by: added_by || '匿名',
                });
            } catch (error) {
                console.error('添加菜品失败:', error);
                socket.emit('error', { message: '添加失败' });
            }
        });

        // 移除菜品
        socket.on('party:removeDish', async ({ share_code, party_dish_id }) => {
            try {
                const party = await Party.findOne({ where: { share_code } });
                if (!party || party.status === 'locked') {
                    socket.emit('error', { message: '饭局已锁定或不存在' });
                    return;
                }

                await PartyDish.destroy({ where: { id: party_dish_id, party_id: party.id } });

                const budget = await calculationEngine.calculatePartyBudget(party.id);
                await party.update({ total_budget: budget });

                io.to(`party:${share_code}`).emit('party:update', {
                    total_budget: budget,
                    action: 'removeDish',
                });
            } catch (error) {
                console.error('移除菜品失败:', error);
                socket.emit('error', { message: '移除失败' });
            }
        });

        // 锁定饭局
        socket.on('party:lock', async ({ share_code }) => {
            try {
                const party = await Party.findOne({ where: { share_code } });
                if (party) {
                    await party.update({ status: 'locked' });
                    io.to(`party:${share_code}`).emit('party:locked', {
                        message: '饭局已锁定，无法继续修改',
                    });
                }
            } catch (error) {
                console.error('锁定饭局失败:', error);
            }
        });

        // 断开连接
        socket.on('disconnect', () => {
            if (socket.share_code) {
                io.to(`party:${socket.share_code}`).emit('party:userLeft', {
                    nickname: socket.nickname,
                    message: `${socket.nickname} 离开了饭局`,
                });
            }
            console.log('用户已断开:', socket.id);
        });
    });
};
