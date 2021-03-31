using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class PlayerEnterTowerCheck : MonoBehaviour
{
    public bool enteringTower = false;

    [SerializeField]
    GameObject light;
    // Start is called before the first frame update
    void Start()
    {
        light.SetActive(false);
    }

    // Update is called once per frame
    private void OnTriggerStay(Collider other)
    {
        if (gameObject.tag == other.gameObject.name)
        {
            enteringTower = true;
            light.SetActive(true);
        }
    }

    private void OnTriggerExit(Collider other)
    {
        enteringTower = false;
        light.SetActive(false);
    }
}
