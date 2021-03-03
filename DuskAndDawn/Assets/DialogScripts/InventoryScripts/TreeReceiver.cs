using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class TreeReceiver : MonoBehaviour
{
    public Animator ani;
    public GameObject gem;

    TreeQuest quest;

    public Inventory inventory;

    void Start()
    {
        ani.SetBool("received", false);
        quest = GameObject.FindObjectOfType<TreeQuest>();
        inventory.ItemUsed += Inventory_ItemUsed;
    }

    public void Inventory_ItemUsed(object sender, InventoryEventArgs e)
    {
    	IInventoryItem item = e.Item;

        if (item.Name == "Sun")
        {
            item.OnUse();
            inventory.RemoveItem(item);
            Debug.Log("received");
            Debug.Log(quest.numRequiredSuns);
        }

        if (quest.numRequiredSuns == 0)
        {
            ani.SetBool("received", true);
            gem.SetActive(true);
        }
    }
}
