using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class InventoryItemBase : MonoBehaviour, IInventoryItem
{
    public virtual string Name
    {
    	get
    	{
    		return "_base item_";
    	}
    }

    public Sprite _Image;

    public Sprite Image
    {
    	get { return _Image; }
    }

    public virtual void OnPickup()
    {
    	gameObject.SetActive(false);
    }

    public virtual void OnDelete(Transform trans)
    {
        gameObject.SetActive(true);
        gameObject.transform.position = trans.position + new Vector3(15, 0, 15);
    }

    public virtual void OnDrop()
    {
        RaycastHit hit = new RaycastHit();
        Ray ray = Camera.main.ScreenPointToRay(Input.mousePosition);
        if (Physics.Raycast(ray, out hit, 1000))
        {
            gameObject.SetActive(true);
            gameObject.transform.position = hit.point + new Vector3(0, 10, 0);
        }
    }
}
