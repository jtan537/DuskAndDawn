using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public interface IInventoryItem
{
	string Name { get; }

	Sprite Image { get; }

	void OnPickup();

	void OnDelete(Transform trans);

	void OnDrop();
}

public class InventoryEventArgs : EventArgs
{
	public IInventoryItem Item;
	
	public InventoryEventArgs(IInventoryItem item)
	{
		Item = item;
	}
}
