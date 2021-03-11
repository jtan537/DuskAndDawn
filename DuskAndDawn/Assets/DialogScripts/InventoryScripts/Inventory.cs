using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class Inventory : MonoBehaviour
{
    private const int SLOTS = 5;

    private IList<InventorySlot> mSlots = new List<InventorySlot>();

    public event EventHandler<InventoryEventArgs> ItemAdded;

    public event EventHandler<InventoryEventArgs> ItemRemoved;

    public event EventHandler<InventoryEventArgs> ItemUsed;

    public Inventory()
    {
        for (int i = 0; i < SLOTS; i++)
        {
            mSlots.Add(new InventorySlot(i));
        }
    }

    private InventorySlot FindStackableSlot(IInventoryItem item)
    {
        foreach (InventorySlot slot in mSlots)
        {
            if (slot.IsStackable(item))
                return slot;
        }
        return null;
    }

    private InventorySlot FindNextEmptySlot()
    {
        foreach (InventorySlot slot in mSlots)
        {
            if (slot.IsEmpty)
                return slot;
        }
        return null;
    }

    public void AddItem(IInventoryItem item)
    {
        InventorySlot freeSlot = FindStackableSlot(item);
        if (freeSlot == null)
        {
            freeSlot = FindNextEmptySlot();
        }
        if (freeSlot != null)
        {
            Collider collider = (item as MonoBehaviour).GetComponent<Collider>();
            if (collider.enabled)
            {
                collider.enabled = false;
                item.OnPickup();
                freeSlot.AddItem(item);
                if (ItemAdded != null)
                {
                    ItemAdded(this, new InventoryEventArgs(item));
                }
            }
        }

    	// if (mItems.Count < SLOTS)
    	// {
    	// 	Collider collider = (item as MonoBehaviour).GetComponent<Collider>();
    	// 	if (collider.enabled)
    	// 	{
    	// 		collider.enabled = false;
    	// 		mItems.Add(item);
    	// 		item.OnPickup();

    	// 		if (ItemAdded != null)
    	// 		{
    	// 			ItemAdded(this, new InventoryEventArgs(item));
    	// 		}
    	// 	}
    	// }
    }

    public void RemoveItem(IInventoryItem item)
    {
        foreach (InventorySlot slot in mSlots)
        {
            if (slot.Remove(item))
            {
                if (ItemRemoved != null)
                {
                    ItemRemoved(this, new InventoryEventArgs(item));
                    GetComponent<AudioSource>().Play();
                }
                break;
            }
        }
        // if (mItems.Remove(item))
        // {
        //     mItems.Remove(item);

        //     item.OnDelete(gameObject.transform);

        //     Collider collider = (item as MonoBehaviour).GetComponent<Collider>();
        //     if (collider != null)
        //     {
        //         collider.enabled = true;
        //     }

        //     if (ItemRemoved != null)
        //     {
        //         ItemRemoved(this, new InventoryEventArgs(item));
        //     }
        // }
    }

    // public List<IInventoryItem> GetItems() {
    //     return mItems;
    // }

    public void UseItem(IInventoryItem item)
    {
        if (ItemUsed != null)
        {
            ItemUsed(this, new InventoryEventArgs(item));
        }
    }
}
