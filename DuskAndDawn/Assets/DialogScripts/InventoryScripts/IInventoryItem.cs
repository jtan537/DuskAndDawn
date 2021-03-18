using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public interface IInventoryItem
{
	string Name { get; }

	Sprite Image { get; }

	string Description { get; }

	void OnPickup(Collider collider);

	void OnDelete(Transform trans);

	void OnDrop();

	void OnUse();

	InventorySlot Slot { get; set; }
}

public class InventoryEventArgs : EventArgs
{
	public IInventoryItem Item;
	
	public InventoryEventArgs(IInventoryItem item)
	{
		Item = item;
	}
}
