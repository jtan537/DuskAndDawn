using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public interface InventoryItem
{
	string Name { get; }

	Sprite Image { get; }

	void OnPickup();

	void OnDrop();
}

public class InventoryEventArgs : EventArgs
{
	public InventoryItem Item;
	
	public InventoryEventArgs(InventoryItem item)
	{
		Item = item;
	}
}
