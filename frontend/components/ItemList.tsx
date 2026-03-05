import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Item, AccountDetail } from '../types';
import { getItems, getAccountDetails, syncItemsFromAccount, updateItem, updateItemMultiSpec, updateItemMultiQtyDelivery, deleteItem } from '../services/api';
import { Box, RefreshCw, ShoppingBag, Edit, Trash2, Save, X, Loader2 } from 'lucide-react';

const ItemList: React.FC = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [accounts, setAccounts] = useState<AccountDetail[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [editForm, setEditForm] = useState({
    item_detail: '',
    is_multi_spec: false,
    is_multi_qty_ship: false
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getAccountDetails().then(setAccounts);
    getItems().then(setItems);
  }, []);

  const handleSync = async () => {
      if (!selectedAccount) return alert('请先选择账号');
      setLoading(true);
      await syncItemsFromAccount(selectedAccount);
      await getItems().then(setItems);
      setLoading(false);
  };

  const handleEdit = (item: Item) => {
    setSelectedItem(item);
    // 解析 item_detail，如果是 JSON 则格式化显示
    let detailStr = '';
    if (item.item_detail) {
      try {
        const parsed = JSON.parse(item.item_detail);
        detailStr = JSON.stringify(parsed, null, 2);
      } catch {
        detailStr = item.item_detail;
      }
    }
    setEditForm({
      item_detail: detailStr,
      is_multi_spec: !!item.is_multi_spec,
      is_multi_qty_ship: !!item.is_multi_qty_ship
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedItem) return;
    setSaving(true);
    try {
      // 保存商品详情
      if (editForm.item_detail) {
        await updateItem(selectedItem.cookie_id, selectedItem.item_id, {
          item_detail: editForm.item_detail
        });
      }

      // 保存多规格状态
      if (editForm.is_multi_spec !== !!selectedItem.is_multi_spec) {
        await updateItemMultiSpec(selectedItem.cookie_id, selectedItem.item_id, editForm.is_multi_spec);
      }

      // 保存多数量发货状态
      if (editForm.is_multi_qty_ship !== !!selectedItem.is_multi_qty_ship) {
        await updateItemMultiQtyDelivery(selectedItem.cookie_id, selectedItem.item_id, editForm.is_multi_qty_ship);
      }

      // 更新本地状态
      const updatedItems = items.map(item =>
        item.cookie_id === selectedItem.cookie_id && item.item_id === selectedItem.item_id
          ? {
              ...item,
              item_detail: editForm.item_detail,
              is_multi_spec: editForm.is_multi_spec,
              is_multi_qty_ship: editForm.is_multi_qty_ship
            }
          : item
      );
      setItems(updatedItems);
      setShowEditModal(false);
    } catch (error) {
      console.error('更新商品失败:', error);
      alert('更新失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: Item) => {
    if (confirm(`确认删除商品"${item.item_title}"吗？`)) {
      try {
        await deleteItem(item.cookie_id, item.item_id);
        const filteredItems = items.filter(i =>
          !(i.cookie_id === item.cookie_id && i.item_id === item.item_id)
        );
        setItems(filteredItems);
      } catch (error) {
        console.error('删除商品失败:', error);
        alert('删除失败，请重试');
      }
    }
  };

  const toggleMultiSpec = async (item: Item) => {
    const newValue = !item.is_multi_spec;
    // 先更新 UI
    const updatedItems = items.map(i =>
      i.cookie_id === item.cookie_id && i.item_id === item.item_id
        ? { ...i, is_multi_spec: newValue }
        : i
    );
    setItems(updatedItems);

    try {
      await updateItemMultiSpec(item.cookie_id, item.item_id, newValue);
    } catch (error) {
      console.error('切换状态失败:', error);
      // 回滚
      setItems(items);
    }
  };

  const toggleMultiQty = async (item: Item) => {
    const newValue = !item.is_multi_qty_ship;
    // 先更新 UI
    const updatedItems = items.map(i =>
      i.cookie_id === item.cookie_id && i.item_id === item.item_id
        ? { ...i, is_multi_qty_ship: newValue }
        : i
    );
    setItems(updatedItems);

    try {
      await updateItemMultiQtyDelivery(item.cookie_id, item.item_id, newValue);
    } catch (error) {
      console.error('切换状态失败:', error);
      // 回滚
      setItems(items);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">商品管理</h2>
          <p className="text-gray-500 mt-2 text-sm">监控并管理所有账号下的闲鱼商品。</p>
        </div>
        <div className="flex gap-3">
            <select
                className="ios-input px-4 py-3 rounded-xl text-sm"
                value={selectedAccount}
                onChange={e => setSelectedAccount(e.target.value)}
            >
                <option value="">选择账号以同步</option>
                {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.nickname}</option>
                ))}
            </select>
            <button
                onClick={handleSync}
                disabled={loading || !selectedAccount}
                className="ios-btn-primary flex items-center gap-2 px-6 py-3 rounded-2xl font-bold shadow-lg shadow-yellow-200 disabled:opacity-50"
            >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                同步商品
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {items.map(item => (
              <div key={`${item.cookie_id}-${item.item_id}`} className="ios-card p-4 rounded-3xl hover:shadow-lg transition-all group relative">
                  <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <button
                        onClick={() => handleEdit(item)}
                        className="p-2 bg-white/90 backdrop-blur rounded-lg shadow-md hover:bg-[#FFE815] transition-colors"
                        title="编辑"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item)}
                        className="p-2 bg-white/90 backdrop-blur rounded-lg shadow-md hover:bg-red-100 text-red-500 transition-colors"
                        title="删除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                  </div>
                  <div className="aspect-square bg-gray-100 rounded-2xl mb-4 overflow-hidden relative">
                      {item.item_image ? (
                          <img src={item.item_image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300">
                              <Box className="w-10 h-10" />
                          </div>
                      )}
                      <div className="absolute top-2 left-2 bg-black/50 backdrop-blur-md text-white text-xs font-bold px-2 py-1 rounded-lg">
                          {item.item_price}
                      </div>
                  </div>
                  <h3 className="font-bold text-gray-900 line-clamp-2 text-sm mb-2 h-10">{item.item_title}</h3>
                  <div className="flex justify-between items-center text-xs text-gray-500 mb-2">
                      <span className="bg-gray-100 px-2 py-1 rounded-md truncate max-w-[100px]">ID: {item.item_id}</span>
                  </div>
                  <div className="flex gap-2">
                      <button
                        onClick={() => toggleMultiSpec(item)}
                        className={`flex-1 text-xs font-bold px-2 py-1.5 rounded-lg transition-colors ${
                          item.is_multi_spec
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        多规格
                      </button>
                      <button
                        onClick={() => toggleMultiQty(item)}
                        className={`flex-1 text-xs font-bold px-2 py-1.5 rounded-lg transition-colors ${
                          item.is_multi_qty_ship
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        多数量发货
                      </button>
                  </div>
              </div>
          ))}
          {items.length === 0 && (
             <div className="col-span-full py-20 text-center text-gray-400">
                 <ShoppingBag className="w-12 h-12 mx-auto mb-4 opacity-30" />
                 暂无商品数据，请选择账号进行同步
             </div>
          )}
      </div>

      {/* 编辑商品弹窗 */}
      {showEditModal && selectedItem && createPortal(
        <div className="modal-overlay-centered">
          <div className="modal-container" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <div>
                <h3 className="text-2xl font-extrabold text-gray-900">编辑商品</h3>
                <p className="text-sm text-gray-500 mt-1">{selectedItem.item_title}</p>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 rounded-xl hover:bg-gray-100 transition-colors flex-shrink-0"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="modal-body">
              <div className="space-y-6">
                {/* 商品图片预览 */}
                {selectedItem.item_image && (
                  <div className="flex justify-center">
                    <img
                      src={selectedItem.item_image}
                      alt=""
                      className="w-32 h-32 object-cover rounded-2xl shadow-md"
                    />
                  </div>
                )}

                {/* 商品基本信息（只读） */}
                <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">商品ID</span>
                    <span className="font-mono text-gray-700">{selectedItem.item_id}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">价格</span>
                    <span className="font-bold text-gray-900">{selectedItem.item_price}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">分类</span>
                    <span className="text-gray-700">{selectedItem.item_category || '未分类'}</span>
                  </div>
                </div>

                {/* 状态开关 */}
                <div className="space-y-4">
                  <label className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl cursor-pointer hover:bg-gray-100 transition-colors">
                    <div>
                      <span className="font-bold text-gray-900">多规格商品</span>
                      <p className="text-xs text-gray-500 mt-0.5">启用后支持按规格匹配发货规则</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditForm({ ...editForm, is_multi_spec: !editForm.is_multi_spec })}
                      className={`switch-toggle ${editForm.is_multi_spec ? 'active' : 'inactive'}`}
                    >
                      <span
                        className="switch-toggle-thumb"
                        style={{ left: editForm.is_multi_spec ? '24px' : '4px' }}
                      />
                    </button>
                  </label>

                  <label className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl cursor-pointer hover:bg-gray-100 transition-colors">
                    <div>
                      <span className="font-bold text-gray-900">多数量发货</span>
                      <p className="text-xs text-gray-500 mt-0.5">启用后支持一次发送多个卡密</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditForm({ ...editForm, is_multi_qty_ship: !editForm.is_multi_qty_ship })}
                      className={`switch-toggle ${editForm.is_multi_qty_ship ? 'active' : 'inactive'}`}
                    >
                      <span
                        className="switch-toggle-thumb"
                        style={{ left: editForm.is_multi_qty_ship ? '24px' : '4px' }}
                      />
                    </button>
                  </label>
                </div>

                {/* 商品详情编辑 */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">商品详情</label>
                  <textarea
                    value={editForm.item_detail}
                    onChange={(e) => setEditForm({ ...editForm, item_detail: e.target.value })}
                    className="w-full ios-input px-4 py-3 rounded-xl h-48 resize-none font-mono text-sm"
                    placeholder="商品详情内容..."
                  />
                  <p className="text-xs text-gray-400 mt-1">支持 JSON 格式或纯文本</p>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-6 py-3 rounded-xl font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={saving}
                  className="flex-1 ios-btn-primary px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      保存中...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      保存更改
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default ItemList;
